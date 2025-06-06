/**
 * @route   GET /api/users/:id
 * @desc    Get details of a specific user (first_name, last_name, id, total cost sum).
 * @param   {Number} id - The user ID in the URL path.
 * @return  {Object} JSON:
 *           {
 *             id:         <Number>,
 *             first_name: <String>,
 *             last_name:  <String>,
 *             total:      <Number>
 *           }
 *         Or an error object.
 */
app.get("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    // Find the user document
    const userDoc = await User.findOne({ id }).lean();
    if (!userDoc) {
      return res.status(404).json({ error: "User not found." });
    }

    // Sum up all costs for this user
    const userCosts = await Cost.find({ userid: id }).lean();
    const totalSum = userCosts.reduce((sum, cost) => sum + cost.sum, 0);

    return res.json({
      id: userDoc.id,
      first_name: userDoc.first_name,
      last_name: userDoc.last_name,
      total: totalSum,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});