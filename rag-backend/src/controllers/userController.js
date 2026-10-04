const User = require("../models/User");

const upgradeUserToPro = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isPro = true;
    user.uploadLimit = 9999;
    await user.save();

    res.json({
      success: true,
      message: "Upgraded to Pro"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upgradeUserToPro
};
