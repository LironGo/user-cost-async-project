/**
 * @file costs.test.js
 * @desc Tests for POST /api/add and GET /api/report endpoints.
 *
 * Uses in-memory MongoDB to avoid touching a real database.
 */

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;
let Cost;

describe("Costs API endpoints", () => {
  /**
   * Before all tests:
   * - Spin up an in-memory MongoDB instance
   * - Set process.env.MONGO_URI to the in-memory URI
   * - Require the Express app (index.js)
   * - Grab the Cost model
   */
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;

    // Require after setting the env
    app = require("../index");

    // Grab the Cost model
    Cost = require("../models/Cost");

    // Wait until Mongoose is connected
    await mongoose.connection.once("open", () => {});
  });

  /**
   * After all tests:
   * - Drop the test database
   * - Close the Mongoose connection
   * - Stop the in-memory MongoDB
   */
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  /**
   * Before each test: clear all Cost documents.
   */
  beforeEach(async () => {
    await Cost.deleteMany({});
  });

  /**
   * Test suite for POST /api/add
   */
  describe("POST /api/add", () => {
    /**
     * Test case: successfully add a new cost item.
     */
    it("should create a new cost and return it with status 201", async () => {
      const newCost = {
        description: "Test cost item",
        category: "food",
        userid: 42,
        sum: 15,
      };

      const res = await request(app)
        .post("/api/add")
        .send(newCost)
        .set("Accept", "application/json");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toMatchObject({
        description: "Test cost item",
        category: "food",
        userid: 42,
        sum: 15,
      });

      // Ensure it was actually saved in the DB
      const costInDb = await Cost.findOne({ _id: res.body._id }).lean();
      expect(costInDb).not.toBeNull();
      expect(costInDb.description).toBe("Test cost item");
      expect(costInDb.category).toBe("food");
      expect(costInDb.userid).toBe(42);
      expect(costInDb.sum).toBe(15);
    });

    /**
     * Test case: sending invalid data (e.g., missing required fields) should return 400.
     */
    it("should return 400 when required fields are missing or invalid", async () => {
      // Missing category
      const invalidCost = {
        description: "Missing category",
        userid: 10,
        sum: 5,
      };

      const res = await request(app)
        .post("/api/add")
        .send(invalidCost)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  /**
   * Test suite for GET /api/report
   */
  describe("GET /api/report", () => {
    /**
     * Test case: invalid query parameters should return 400.
     */
    it("should return 400 if id, year, or month are not valid numbers", async () => {
      const res = await request(app).get(
        "/api/report?id=foo&year=2025&month=5"
      );
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "error",
        "Invalid id, year, or month parameter."
      );
    });

    /**
     * Test case: when there are no costs for a user in the given month, it should return an empty grouping.
     */
    it("should return empty arrays for all categories if no costs exist in the specified month", async () => {
      // No costs inserted

      const res = await request(app).get(
        "/api/report?id=123&year=2025&month=6"
      );
      expect(res.status).toBe(200);

      // Expect structure: { userid: 123, year: 2025, month: 6, costs: [ {food:[]}, {health:[]}, … ] }
      expect(res.body).toEqual({
        userid: 123,
        year: 2025,
        month: 6,
        costs: [
          { food: [] },
          { health: [] },
          { housing: [] },
          { sport: [] },
          { education: [] },
        ],
      });
    });

    /**
     * Test case: costs created within the target month should be grouped by category.
     */
    it("should return correctly grouped costs for a given user, year, and month", async () => {
      // Prepare some costs with explicit createdAt to control the month/day
      const june1 = new Date(Date.UTC(2025, 5, 1, 12, 0, 0)); // June 1, 2025
      const june15 = new Date(Date.UTC(2025, 5, 15, 14, 0, 0)); // June 15, 2025
      const july1 = new Date(Date.UTC(2025, 6, 1, 9, 0, 0)); // July 1, 2025 (should be excluded)

      // Directly insert using Mongoose create, overriding createdAt
      await Cost.create([
        {
          description: "June lunch",
          category: "food",
          userid: 7,
          sum: 12,
          createdAt: june1,
          updatedAt: june1,
        },
        {
          description: "June doctor",
          category: "health",
          userid: 7,
          sum: 50,
          createdAt: june15,
          updatedAt: june15,
        },
        {
          description: "July rent",
          category: "housing",
          userid: 7,
          sum: 500,
          createdAt: july1,
          updatedAt: july1,
        },
      ]);

      const res = await request(app).get("/api/report?id=7&year=2025&month=6");
      expect(res.status).toBe(200);

      // Expect only the two June costs to appear, grouped correctly
      expect(res.body.userid).toBe(7);
      expect(res.body.year).toBe(2025);
      expect(res.body.month).toBe(6);

      // Find each category entry
      const costsArray = res.body.costs;
      const foodEntry = costsArray.find((e) => e.food !== undefined);
      const healthEntry = costsArray.find((e) => e.health !== undefined);
      const housingEntry = costsArray.find((e) => e.housing !== undefined);

      // Validate "food" category: one item, day=1 (UTC day of month from june1)
      expect(foodEntry.food).toHaveLength(1);
      expect(foodEntry.food[0]).toMatchObject({
        sum: 12,
        description: "June lunch",
        day: 1,
      });

      // Validate "health" category: one item, day=15
      expect(healthEntry.health).toHaveLength(1);
      expect(healthEntry.health[0]).toMatchObject({
        sum: 50,
        description: "June doctor",
        day: 15,
      });

      // Housing for June should be empty
      expect(housingEntry.housing).toHaveLength(0);

      // The other categories (sport, education) should also be empty arrays
      const sportEntry = costsArray.find((e) => e.sport !== undefined);
      const educationEntry = costsArray.find((e) => e.education !== undefined);
      expect(sportEntry.sport).toHaveLength(0);
      expect(educationEntry.education).toHaveLength(0);
    });
  });
});
