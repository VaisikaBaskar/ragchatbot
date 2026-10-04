exports.testEndpoint = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Test endpoint working perfectly!",
  });
};
