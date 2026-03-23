const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated. Please log in first.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This action is restricted to: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};

module.exports = { restrictTo };