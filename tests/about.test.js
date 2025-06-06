/**
 * @file about.test.js
 * @desc Tests for the GET /api/about endpoint, which returns a hardcoded list of team members.
 */

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;

describe("GET /api/about", () => {
  /**
   * Before all tests: spin up in-memory Mongo (required because index.js tries to connect)
   * and set MONGO_URI, then require the app.
   */
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;

    // Require after env is set
    app = require("../index");

    // Wait for connection to be established
    await mongoose.connection.once("open", () => {});
  });

  /**
   * After all tests: drop DB, close connection, and stop memory server.
   */
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  /**
   * Test case: GET /api/about should return an array of team members with correct fields.
   */
  it("should return the hardcoded team members", async () => {
    const res = await request(app).get("/api/about");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // We expect exactly two members
    expect(res.body.length).toBe(2);

    // Check that each object has id, first_name, last_name, birthday, marital_status
    res.body.forEach((member) => {
      expect(member).toHaveProperty("id");
      expect(member).toHaveProperty("first_name");
      expect(member).toHaveProperty("last_name");
      expect(member).toHaveProperty("birthday");
      expect(member).toHaveProperty("marital_status");
    });

    // check the exact hardcoded values
    expect(res.body).toContainEqual({
      id: "208995068",
      first_name: "Liron",
      last_name: "Golan",
      birthday: "03/06/1997",
      marital_status: "single",
    });
    expect(res.body).toContainEqual({
      id: "206845570",
      first_name: "Paz",
      last_name: "Elisha",
      birthday: "04/10/1998",
      marital_status: "single",
    });
  });
});
