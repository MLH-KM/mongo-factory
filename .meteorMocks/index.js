const _ = require('lodash');
let usersQueryResult = [];

function __setUsersQueryResult(result) {
    usersQueryResult = result;
}

const Mongo = {
    Collection: jest.fn().mockImplementation(() => ({
        _collection: [],

        insert: jest.fn().mockImplementation(function(doc) {
            this._collection.push(doc);
            return doc._id;
        }),
        remove: jest.fn().mockImplementation(function(modifier) {
            this._collection = _.reject(this._collection, modifier);
        }),
        findOne: jest.fn().mockImplementation(function(docId) {
            return _.find(this._collection, ['_id', docId]);
        }),
        find: jest.fn().mockImplementation(function(modifier) {
            return _.filter(this._collection, modifier);
        })
    }))
};

const Meteor = {
    Collection: Mongo.Collection,
    users: {
        findOne: jest.fn().mockImplementation(() => usersQueryResult),
        find: jest.fn().mockImplementation(() => ({
            fetch: jest.fn().mockReturnValue(usersQueryResult),
            count: jest.fn()
        }))
    }
};

module.exports = {
    __setUsersQueryResult,
    Mongo,
    Meteor
};
