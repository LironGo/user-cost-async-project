const express = require("express");
const router = express.Router();

/**
 * @route   GET /api/about
 * @desc    Get a JSON document listing all team members (hardcoded). Fill in personal details.
 * @return  {Array<Object>} e.g. [ {id: 'ID', first_name: 'First', last_name: 'Last', birthday: 'DD/MM/YYYY', marital_status:'single/married/divorced/widowed' }, { … } ]
 */
router.get("/about", (req, res) => {
  const team = [
    {
      id: "208995068",
      first_name: "Liron",
      last_name: "Golan",
      birthday: "03/06/1997",
      marital_status: "single",
    },
    {
      id: "206845570",
      first_name: "Paz",
      last_name: "Elisha",
      birthday: "04/10/1998",
      marital_status: "single",
    },
  ];

  return res.json(team);
});

module.exports = router;
