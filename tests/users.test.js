/**
 * @file users.test.js
 * @desc Tests for the GET /api/users/:id endpoint.
 *
 * Uses an in-memory MongoDB to avoid touching a real database.
 */

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;
let User;
let Cost;

describe("GET /api/users/:id", () => {
  /**
   * Before all tests, spin up an in-memory MongoDB instance,
   * set process.env.MONGO_URI accordingly, require the app, and grab models.
   */
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;

    // Require after setting MONGO_URI so that index.js connects to the in-memory server.
    app = require("../index");

    // Grab the models
    User = require("../models/user");
    Cost = require("../models/cost");

    // Wait for mongoose to connect
    await mongoose.connection.once("open", () => {});
  });

  /**
   * After all tests, stop in-memory MongoDB and close the mongoose connection.
   */
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  /**
   * Before each test, clear the User and Cost collections.
   */
  beforeEach(async () => {
    await User.deleteMany({});
    await Cost.deleteMany({});
  });

  /**
   * Test case: retrieving a user that does not exist should return 404.
   */
  it("should return 404 if user is not found", async () => {
    const res = await request(app).get("/api/users/12345");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found.");
  });

  /**
   * Test case: invalid (non-numeric) ID should return 400.
   */
  it("should return 400 when ID is not a number", async () => {
    const res = await request(app).get("/api/users/notANumber");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid user ID.");
  });

  /**
   * Test case: existing user with no costs should return total: 0.
   */
  it("should return user details with total = 0 when user exists but has no costs", async () => {
    // Insert a test user *including* required fields
    await User.create({
      id: 1,
      first_name: "Alice",
      last_name: "Anderson",
      birthday: "01/01/2000",
      marital_status: "single",
    });

    const res = await request(app).get("/api/users/1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      first_name: "Alice",
      last_name: "Anderson",
      total: 0,
    });
  });

  /**
   * Test case: existing user with multiple cost documents should return correct total sum.
   */
  it("should return user details with correct total sum of costs", async () => {
    // Insert a test user *including* required fields
    await User.create({
      id: 2,
      first_name: "Bob",
      last_name: "Brown",
      birthday: "02/02/1990",
      marital_status: "married",
    });

    // Insert multiple costs for user id=2
    await Cost.create([
      {
        description: "Lunch",
        category: "food",
        userid: 2,
        sum: 10,
      },
      {
        description: "Bus Ticket",
        category: "education",
        userid: 2,
        sum: 5,
      },
      {
        description: "Gym Membership",
        category: "sport",
        userid: 2,
        sum: 20,
      },
    ]);

    const res = await request(app).get("/api/users/2");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 2,
      first_name: "Bob",
      last_name: "Brown",
      total: 35,
    });
  });
});
