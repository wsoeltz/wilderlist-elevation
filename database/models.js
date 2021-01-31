const {Schema, model} = require('mongoose');

const MountainSchema = new Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  elevation: { type: Number, required: true },
  state: {
    type: Schema.Types.ObjectId,
    ref: 'state',
  },
  lists: [{
    type: Schema.Types.ObjectId,
    ref: 'list',
  }],
  optionalLists: [{
    type: Schema.Types.ObjectId,
    ref: 'list',
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  status: { type: String },
  flag: { type: String },
  description: { type: String },
  resources: [{
    title: { type: String },
    url: { type: String },
  }],
  location: [{type: Number}],
  trailAccessible: {type: Boolean},
});

const Mountain = model('mountain', MountainSchema);

const StateSchema = new Schema({
  name: { type: String, required: true },
  abbreviation: { type: String, required: true },
  regions: [{
    type: Schema.Types.ObjectId,
    ref: 'region',
  }],
  mountains: [{
    type: Schema.Types.ObjectId,
    ref: 'mountain',
  }],
  peakLists: [{
    type: Schema.Types.ObjectId,
    ref: 'peakList',
  }],
});

const State = model('state', StateSchema);

const TrailSchema = new Schema({
  name: { type: String },
  osmId: { type: Number },
  relId: { type: String },
  type: { type: String },
  states: [{
    type: Schema.Types.ObjectId,
    ref: 'state',
  }],
  line: [[Number]],
  center: [{type: Number}],
  allowsBikes: { type: Boolean },
  allowsHorses: { type: Boolean },
  parents: [{
    type: Schema.Types.ObjectId,
    ref: 'trails',
  }],
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'trails',
  }],
  waterCrossing: { type: String },
  skiTrail: { type: Boolean },
});

TrailSchema.index({ center: '2dsphere' });
TrailSchema.index({ name: 'text' });

const Trail = model('trails', TrailSchema);

const PeakListSchema = new Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  description: { type: String },
  optionalPeaksDescription: { type: String },
  type: { type: String, required: true},
  mountains: [{
    type: Schema.Types.ObjectId,
    ref: 'mountain',
  }],
  optionalMountains: [{
    type: Schema.Types.ObjectId,
    ref: 'mountain',
  }],
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'user',
  }],
  numUsers: { type: Number, required: true },
  parent: { type: Schema.Types.ObjectId },
  searchString: { type: String, required: true },
  states: [{
    type: Schema.Types.ObjectId,
    ref: 'state',
  }],
  resources: [{
    title: { type: String },
    url: { type: String },
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  status: { type: String },
  flag: { type: String },
  tier: { type: String },
  center: [{type: Number}],
  bbox: [{type: Number}],
  classification:  { type: String },
});

const PeakList = model('list', PeakListSchema);


module.exports = {
  Mountain,
  State,
  Trail,
  PeakList,
}