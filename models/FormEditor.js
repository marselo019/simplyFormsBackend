const mongoose = require("mongoose");

const ElementSchema = new mongoose.Schema({
 index: Number,
 idQuestion: String,
 type: String,
 question: String,
 description: String,
 required: Boolean,
 settings: mongoose.Schema.Types.Mixed,
 answer: mongoose.Schema.Types.Mixed,
 url: String,
 descriptionTitle: String,
 title: String
}, { _id: false });

const ThemeSchema = new mongoose.Schema({
 color: String,
 font: String,
 layout: String
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
 general: {
  makeThisQuiz: { type: Boolean, default: false }
 },
 quiz: {
  releasedGrades: { type: String, enum: ['immediate', 'manual'], default: 'manual' },
  respondentSettings: {
   missedQuestion: { type: Boolean, default: false },
   correctAnswer: { type: Boolean, default: false },
   pointValues: { type: Boolean, default: false }
  },
  globalDefaults: {
   defaultQuestionPointValue: { type: Number, default: 1 }
  }
 },
 responses: {
  collectEmail: { type: String, enum: ['none', 'verified', 'input'], default: 'none' },
  sendCopy: { type: String, enum: ['off', 'requested', 'always'], default: 'off' },
  allowEdit: { type: Boolean, default: false },
  limitOneResponse: { type: Boolean, default: false }
 },
 presentation: {
  progressBar: { type: Boolean, default: false },
  shuffleQuestions: { type: Boolean, default: false },
  confirmationMessage: { type: String, default: "Your response has been recorded" },
  submitAnother: { type: Boolean, default: false },
  viewSummary: { type: Boolean, default: false },
  disableAutosave: { type: Boolean, default: false }
 },
 defaults: {
  defaultCollectEmail: { type: Boolean, default: false },
  defaultRequired: { type: Boolean, default: false }
 }
}, { _id: false });

const FormSchema = new mongoose.Schema({
 formId: { type: String, required: true, unique: true },
 userId: { type: String, required: true },
 thumbnail: String,
 title: String,
 description: String,
 elements: [ElementSchema],
 settings: SettingsSchema,
 theme: ThemeSchema,
 logic: { type: Array, default: [] },
 autosave: { type: Boolean, default: true },
 createdAt: { type: Date, default: Date.now },
 updatedAt: { type: Date, default: Date.now },
 published: Boolean,
 publishedAt: { type: Date },
});

module.exports = mongoose.model("Form", FormSchema);