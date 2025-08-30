const express = require('express');
const router = express.Router();
const FormEditor = require('../models/FormEditor');
const FormResponses = require('../models/FormResponses');
const verifyToken = require("../middleware/auth");
// const { generateThumbnail } = require("../helper/puppeteerRender");
// const { uploadToCDN } = require("../helper/uploadToCDN");
// const { nanoid } = require('nanoid'); // untuk generate formId unik

//! EDITOR
// Create Form
router.post('/create', async (req, res) => {
 try {
  const { nanoid } = await import('nanoid');
  const { userId } = req.body; // ambil dari token atau langsung kirim dari frontend
  const formId = nanoid(13); // bikin formId unik (misal: '1a2b3c')

  const newForm = new FormEditor({
   formId,
   userId,
   title: 'Untitled Form',
   description: '',
   elements: [],
   theme: {
    color: '#6200ea',
    font: 'Roboto',
    layout: 'minimalistic'
   },
   logic: [],
   autosave: true,
   createdAt: new Date(),
   updatedAt: new Date(),
   published: false,
   settings: {
    general: {},
    quiz: {},
    responses: {},
    presentation: {},
    defaults: {}
   }
  });

  await newForm.save();

  res.status(200).json({ code: 201, success: true, formId });
 } catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Failed to create form' });
 }
});

// Get Forms List
router.post('/get', verifyToken, async (req, res) => {
 const { userId } = req.body;

 const Form = await FormEditor.find({ userId: userId });

 const simplified = [];

 Form.forEach(form => {
  simplified.push({
   title: form.title,
   description: form.description,
   formId: form.formId,
   published: form.published,
   createdAt: form.createdAt,
   link: `/forms/${form.formId}`
  });
 });

 res.status(200).json({ listForm: simplified, success: true });
})

// SAVE (Create or Update) form
router.post('/save', verifyToken, async (req, res) => {
 const { userId } = req;
 const { formId, title, description, elements, theme, logic, autosave } = req.body.payload;

 try {
  // Ambil form lama (kalau ada)
  const existingForm = await FormEditor.findOne({ formId });

  // Mapkan elemen dengan mempertimbangkan idQuestion lama jika ada
  const fixedElements = elements.map((el, i) => {
   // Coba ambil idQuestion dari form lama berdasarkan index yang sama
   const oldId = existingForm?.elements?.[i]?.idQuestion;

   return {
    ...el,
    idQuestion: oldId || el.idQuestion
   };
  });

  // Update atau buat form
  if (existingForm) {
   existingForm.title = title;
   existingForm.description = description;
   existingForm.elements = fixedElements;
   existingForm.theme = theme;
   existingForm.logic = logic;
   existingForm.autosave = autosave;
   existingForm.updatedAt = new Date();
   await existingForm.save();
  } else {
   const newForm = new FormEditor({
    formId,
    userId,
    title,
    description,
    elements: fixedElements,
    theme,
    logic,
    autosave
   });
   await newForm.save();
  }

  res.json({ success: true, formId });

 } catch (err) {
  console.error('[SAVE ERROR]', err);
  res.status(500).json({ message: err.message });
 }
});

router.post('/publish', verifyToken, async (req, res) => {
 const { formId } = req.body.payload;
 try {
  let form = await FormEditor.findOne({ formId });
  if (form) {
   form.published = !form.published
   await form.save();
  }
  res.json({ success: true, formId: form.formId, published: form.published });
 } catch (err) {
  res.status(500).json({ message: err.message });
 }
});

// GET form by ID Editor
router.post('/:formId', verifyToken, async (req, res) => {
 try {
  const form = await FormEditor.findOne({ formId: req.params.formId });
  if (!form) return res.status(404).json({ message: 'Form not found' });
  res.json(form);
 } catch (err) {
  res.status(500).json({ message: err.message });
 }
});

// Settings
router.post('/:formId/settings', verifyToken, async (req, res) => {
 try {
  const { updatedSettings } = req.body;

  const { formId } = req.params;

  const form = await FormEditor.findOneAndUpdate(
   { formId },
   { $set: { settings: updatedSettings, updatedAt: new Date() } },
   { new: true }
  );

  if (!form) return res.status(404).json({ message: 'Form not found' });

  res.json({ message: 'Settings updated', settings: form.settings });
 } catch (error) {
  res.status(500).json({ message: 'Server error', error });
 }
});

// Generate Thumbnail Form
router.post("/:formId/generate-thumbnail", async (req, res) => {
 const { formId } = req.params;
 const path = await generateThumbnail(formId);
 const cdnUrl = await uploadToCDN(path);

 // simpan ke MongoDB
 await Form.findByIdAndUpdate(formId, { thumbnail: cdnUrl });

 res.json({ success: true, url: cdnUrl });
});

// Delete Form
router.post('/:formId/delete', verifyToken, async (req, res) => {
 try {
  const { formId } = req.params;
  const { userId } = req.body; // ambil dari token atau frontend

  const form = await FormEditor.findOneAndDelete({ formId, userId });

  if (!form) {
   return res.status(404).json({ error: 'Form not found or unauthorized' });
  }

  res.status(200).json({ code: 200, success: true, message: 'Form deleted successfully' });
 } catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Failed to delete form' });
 }
});

// Delete Form Responses
router.post('/:formId/deleteResponses', verifyToken, async (req, res) => {
 const { formId } = req.params;
 const deleted = await FormResponses.deleteMany({ formId });
 
 res.json({ success: true, deletedCount: deleted.deletedCount });
})

// Form Check
router.post('/:formId/respond-check', verifyToken, async (req, res) => {
 const { formId } = req.params;
 const email = req.user?.email;

 if (!email) return res.status(400).json({ error: 'No email' });

 const form = await FormEditor.findOne({ formId });
 if (!form) return res.status(404).json({ error: 'Form not found' });

 const limitOne = form.settings?.responses?.limitOneResponse;

 if (!limitOne) return res.json({ allowed: true });

 const alreadySubmitted = await FormResponses.findOne({
  formId,
  email,
  'historicSubmit.0': { $exists: true }
 });

 if (alreadySubmitted) {
  return res.json({ allowed: false, message: 'You already submitted this form.' });
 }

 res.json({ allowed: true });
});

// Get All Forms Responds
router.post('/:formId/all', async (req, res) => {
 try {
  const { formId } = req.params;
  const responses = await FormResponses.find({ formId });
  const questionIdArray = await FormEditor.findOne({ formId })

  if (!responses) {
   return res.status(404).json({ message: 'No responses found' });
  }

  res.status(200).json({ responses: responses, questionIdArray: questionIdArray.elements });
 } catch (err) {
  res.status(500).json({ message: err.message });
 }
});

//! RESPONSES
// GET form by ID User
router.post('/:formId/responds', verifyToken, async (req, res) => {
 try {
  const form = await FormEditor.findOne({ formId: req.params.formId });

  if (!form) return res.status(200).json({ code: 404, message: 'Form not found' });
  res.status(200).json({ code: 200, form: { settings: form.settings, title: form.title, description: form.description, published: form.published, theme: form.theme, elements: form.elements, requiredLogin: (form.settings.responses.collectEmail == "verified") ? true : false }, email: req.user?.email, username: req.user?.username });
 } catch (err) {
  res.status(500).json({ message: err.message });
 }
});

router.post('/:formId/settings/get', async (req, res) => {
 const form = await FormEditor.findOne({ formId: req.params.formId });
 if (!form) return res.status(404).json({ message: 'Form not found' });

 res.status(200).json({ code: 200, settings: form.settings || {} });
})

// Submit Form
router.post('/:formId/submit', async (req, res) => {
 try {
  const { nanoid } = await import('nanoid');
  const { formId } = req.params;
  const { answers, metadata, settingsSnapshot, responseId, email } = req.body.payload;

  const newSubmission = {
   answers,
   metadata: {
    email: metadata?.email || null,
    quizScore: metadata?.quizScore || null,
    timeSubmitted: new Date()
   },
   settingsSnapshot,
   responseId: nanoid(6)
  };

  let responseForm = await FormResponses.findOne({ formId, email });

  if (responseForm) {
   responseForm.historicSubmit.push(newSubmission);
   await responseForm.save();
  } else {
   responseForm = await FormResponses.create({
    email,
    formId,
    responseId,
    historicSubmit: [newSubmission]
   });
  }

  res.status(200).json({ success: true, message: 'Response saved', responseForm });
 } catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Failed to save response' });
 }
});

module.exports = router;