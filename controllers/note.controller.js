import { Org } from "../model/org.model.js";
import { User } from "../model/user.model.js";

export async function addNotes(req, res) {
  try {
    const { title, content } = req.body;

    // Ensure required fields are present
    if (!title || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("NOTE", req.body);

    // Get user/org from the middleware
    const acc = req.user;

    // Ensure acc.notes exists, if not, initialize it as an empty array
    if (!acc.notes) {
      acc.notes = [];
    }

    // Push the new note to the appropriate notes array
    acc.notes.push({ title, content, date: new Date() });

    // Save the updated user/org
    await acc.save();

    // Return the success response
    res.status(200).json({
      success: true,
      message: "Note added successfully",
      notes: acc.notes,
      user: {
        ...acc._doc, // Spread the user document to include all fields
        password: "", // Remove the password field from the response
      },
    });
  } catch (error) {
    console.error("Error saving note:", error);
    res
      .status(500)
      .json({ message: "Error saving note", error: error.message });
  }
}

export async function getNotes(req, res) {
  try {
    const { userId } = req.query;
    // console.log("User ID:", userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    const org = await Org.findById(userId);

    if (!user && !org) {
      return res
        .status(404)
        .json({ message: "User or organization not found" });
    }

    const acc = user || org;
    res.status(200).json({ success: true, notes: acc.notes });
  } catch (error) {
    console.error("Error getting notes:", error);
    res.status(500);
    // .json({ message: "Error getting notes", error: error.message });
  }
}

export async function deleteNote(req, res) {
  try {
    const { userId, noteId } = req.body;
    console.log("USERID", userId);
    console.log("NOTEID", noteId);

    if (!userId || !noteId) {
      return res
        .status(400)
        .json({ message: "User ID and Note ID are required" });
    }

    // Find user or organization
    const user = await User.findById(userId);
    const org = await Org.findById(userId);

    if (!user && !org) {
      return res
        .status(404)
        .json({ message: "User or organization not found" });
    }

    const acc = user || org;

    // Filter out the note to be deleted
    acc.notes = acc.notes.filter((note) => note._id.toString() !== noteId);

    // Save the updated user/org document
    await acc.save();

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
      notes: acc.notes,
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    res
      .status(500)
      .json({ message: "Error deleting note", error: error.message });
  }
}
