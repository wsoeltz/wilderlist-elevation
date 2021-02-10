const {Schema, model} = require('mongoose');

const MountainSchema = new Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  elevation: { type: Number, required: true },
  prominence: { type: Number },
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
  locationText: { type: String },
  locationTextShort: { type: String },
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

const ParkingSchema = new Schema({
  name: { type: String },
  osmId: { type: String },
  type: { type: String },
  location: [{type: Number}],
})

ParkingSchema.index({ location: '2dsphere' });

const Parking = model('parking', ParkingSchema, 'parking');

const CampsiteSchema = new Schema({
  reserveamericaId: { type: String },
  ridbId: { type: String },
  osmId: { type: String },
  name: { type: String },
  location: [{type: Number}],
  state: {
    type: Schema.Types.ObjectId,
    ref: 'state',
  },
  website: { type: String },
  type: { type: String },
  ownership: { type: String },
  electricity: { type: Boolean },
  toilets: { type: Boolean },
  drinking_water: { type: Boolean },
  email: { type: String },
  reservation: { type: String },
  showers: { type: Boolean },
  phone: { type: String },
  fee: { type: Boolean },
  tents: { type: Boolean },
  capacity: { type: Number },
  internet_access: { type: Boolean },
  fire: { type: Boolean },
  maxtents: { type: Number },
  flag: { type: String },
  locationText: { type: String },
  locationTextShort: { type: String },
  elevation: { type: Number },
});

CampsiteSchema.index({ center: '2dsphere' });
CampsiteSchema.index({ name: 'text' });

const Campsite = model('campsite', CampsiteSchema);

module.exports = {
  Mountain,
  State,
  Trail,
  PeakList,
  Parking,
  Campsite,
}
