const mongoose = require('mongoose');

const bookHistorySchema = new mongoose.Schema({
    bookId: {
        type: String,
        required: true
    },
    readDate: {
        type: Date,
        default: Date.now
    },
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    comment: {
        type: String,
        maxLength: 1000
    }
});

const profileSchema = new mongoose.Schema({
    _id: {
        type: String,  // Utilisé pour stocker l'ID de l'utilisateur PostgreSQL
        required: true
    },
    preferences: {
        favoriteGenres: [{
            type: String,
            trim: true
        }],
        favoriteAuthors: [{
            type: String,
            trim: true
        }]
    },
    history: [bookHistorySchema],
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, {
  timestamps: { 
    createdAt: 'created', 
    updatedAt: 'updated' 
  }
});

// Update timestamp on save
profileSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

class ProfileClass {
  static async findAll() {
    return this.find().sort('-created');
  }

  static async findById(id) {
    return this.findOne({ _id: id });
  }

  static async createOne({ userId, preferences }) {
    return this.create({
      _id: userId,
      preferences: {
        favoriteGenres: preferences?.favoriteGenres || [],
        favoriteAuthors: preferences?.favoriteAuthors || []
      }
    });
  }

  static async updateOne(id, { preferences }) {
    const updates = {};
    
    if (preferences) {
      if (preferences.favoriteGenres) {
        updates['preferences.favoriteGenres'] = preferences.favoriteGenres;
      }
      if (preferences.favoriteAuthors) {
        updates['preferences.favoriteAuthors'] = preferences.favoriteAuthors;
      }
    }

    return this.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  static async deleteOne(id) {
    const result = await this.findByIdAndDelete(id);
    return !!result;
  }

  async addBookToHistory(bookId, rating, comment) {
    this.history.push({
      bookId,
      rating,
      comment,
      readDate: new Date()
    });
    return this.save();
  }

  async updateBookInHistory(bookId, rating, comment) {
    const bookEntry = this.history.find(entry => entry.bookId === bookId);
    if (bookEntry) {
      if (rating !== undefined) bookEntry.rating = rating;
      if (comment !== undefined) bookEntry.comment = comment;
      return this.save();
    }
    return null;
  }

  async removeBookFromHistory(bookId) {
    this.history = this.history.filter(entry => entry.bookId !== bookId);
    return this.save();
  }
}

profileSchema.loadClass(ProfileClass);
const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
