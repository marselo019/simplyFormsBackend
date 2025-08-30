const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AnswerSchema = new mongoose.Schema({
 idQuestion: { type: String, required: true },
 answer: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: true });

const SubmissionSchema = new mongoose.Schema({
 responseId: { type: String, required: true },
 answers: [AnswerSchema],
 metadata: {
  typeEmail: { type: String, default: null },
  email: { type: String, default: null },
  quizScore: { type: Number, default: null },
  timeSubmitted: { type: Date, default: Date.now }
 },
 settingsSnapshot: {
  makeThisQuiz: { type: Boolean },
  collectEmail: { type: String },
  confirmationMessage: { type: String },
  disableAutosave: { type: Boolean },
  submitAnother: { type: Boolean },
  viewSummary: { type: Boolean },
  limitOneResponse: { type: Boolean }
 }
}, { _id: false });

const ResponseFormSchema = new mongoose.Schema({
 formId: { type: String, required: true },
 responseId: { type: String, required: true, default: () => uuidv4().slice(0, 6) },
 historicSubmit: [SubmissionSchema],
 email: { type: String, required: false }
}, { timestamps: true });

module.exports = mongoose.model('ResponseForm', ResponseFormSchema);