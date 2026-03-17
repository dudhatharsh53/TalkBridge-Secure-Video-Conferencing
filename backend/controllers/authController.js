const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { name, email, mobileNo, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ name, email, mobileNo, password });
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, mobileNo: user.mobileNo, role: user.role }
        });
    } catch (error) {
        console.error('Registration Error:', error);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: Object.values(error.errors).map(val => val.message).join(', ')
            });
        }

        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, mobileNo: user.mobileNo, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, mobileNo } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (mobileNo) user.mobileNo = mobileNo;

        await user.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            user: { id: user._id, name: user.name, email: user.email, mobileNo: user.mobileNo, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { email } = req.query;
        const users = await User.find({
            email: { $regex: email, $options: 'i' },
            _id: { $ne: req.user.id }
        }).select('name email');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

