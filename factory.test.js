const _ = require('lodash');
const nanoid = require('nanoid');
const { Mongo } = require('meteor/mongo');

const Authors = new Mongo.Collection('authors');
const Books = new Mongo.Collection('books');

global.LocalCollection = {
    _modify: jest.fn().mockImplementation((record, modifier, ...args) => {
        Object.keys(modifier.$set).forEach(key => {
            _.set(record, key, modifier.$set[key]);
        });
    })
};

global.Random = {
    id: jest.fn().mockImplementation(() => nanoid(17))
};

const Factory = require('./factory.js');

test('Factory - Build - Basic build works', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    const res = Factory.build('author');

    expect(Factory.build('author').name).toEqual('John Smith');
});

test('Factory - Define - After hook', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    }).after(doc => {
        var author = Factory.create('author');
        expect(author.name).toEqual('John Smith');
        expect(doc.name).toEqual('John Smith');
    });
});

test('Factory - Build - Functions - Basic', () => {
    Factory.define('author', Authors, {
        name() {
            return 'John Smith';
        }
    });

    expect(Factory.build('author').name).toEqual('John Smith');
});

test('Factory - Build - Functions - Context', () => {
    Factory.define('author', Authors, {
        test: 'John Smith',
        name() {
            return this.test;
        }
    });

    expect(Factory.build('author').name).toEqual('John Smith');
});

test('Factory - Build - Dotted properties - Basic', () => {
    Factory.define('author', Authors, {
        'profile.name': 'John Smith'
    });

    const res = Factory.build('author');

    expect(Factory.build('author').profile.name).toEqual('John Smith');
});

test('Factory - Build - Dotted properties - Context', () => {
    Factory.define('author', Authors, {
        name: 'John Smith',
        'profile.name'() {
            return this.name;
        }
    });

    expect(Factory.build('author').profile.name).toEqual('John Smith');
});

test('Factory - Build - Deep objects', () => {
    Factory.define('author', Authors, {
        profile: {
            name: 'John Smith'
        }
    });

    expect(Factory.build('author').profile.name).toEqual('John Smith');
});

test('Factory - Build - Functions - Deep object - Basic', () => {
    Factory.define('author', Authors, {
        profile: {
            name() {
                return 'John Smith';
            }
        }
    });

    expect(Factory.build('author').profile.name).toEqual('John Smith');
});

test('Factory - Build - Functions - Deep object - Context', () => {
    Factory.define('author', Authors, {
        name: 'John Smith',
        profile: {
            name() {
                return this.name;
            }
        }
    });

    expect(Factory.build('author').profile.name).toEqual('John Smith');
});

test('Factory - Build - Extend - Basic', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('authorOne', Authors, Factory.extend('author'));

    expect(Factory.build('authorOne').name).toEqual('John Smith');
});

test('Factory - Build - Extend - With attributes', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define(
        'authorOne',
        Authors,
        Factory.extend('author', {
            test: 'testing!'
        })
    );

    expect(Factory.build('authorOne').name).toEqual('John Smith');
    expect(Factory.build('authorOne').test).toEqual('testing!');
});

test("Factory - Build - Extend - With attributes (check that we don't modify the parent)", () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define(
        'authorOne',
        Books,
        Factory.extend('author', {
            test: 'testing!'
        })
    );

    var authorOne = Factory.build('authorOne');
    var author = Factory.build('author');

    expect(authorOne.name).toEqual('John Smith');
    expect(authorOne.test).toEqual('testing!');
    expect(_.isUndefined(author.test)).toEqual(true);
});

test('Factory - Build - Extend - Parent with relationship', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        authorId: Factory.get('author'),
        name: 'A book',
        year: 2014
    });

    Factory.define('bookOne', Books, Factory.extend('book'));

    var bookOne = Factory.create('bookOne');

    expect(bookOne.name).toEqual('A book');
});

test('Factory - Build - Extend - Parent with relationship - Extra attributes', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        authorId: Factory.get('author'),
        name: 'A book',
        year: 2014
    });

    Factory.define(
        'bookOne',
        Books,
        Factory.extend('book', {
            name: 'A better book'
        })
    );

    var bookOne = Factory.create('bookOne');

    expect(bookOne.name).toEqual('A better book');
    // same year as parent
    expect(bookOne.year).toEqual(2014);
});

test('Factory - Create - Basic', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    var author = Factory.create('author');

    expect(author.name).toEqual('John Smith');
});

test('Factory - Create - Relationship', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        authorId: Factory.get('author'),
        name: 'A book',
        year: 2014
    });

    var book = Factory.create('book');

    expect(Authors.findOne(book.authorId).name).toEqual('John Smith');
});

test('Factory - Create - Relationship - return a Factory from function', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        authorId() {
            return Factory.get('author');
        },
        name: 'A book',
        year: 2014
    });

    var book = Factory.create('book');

    expect(Authors.findOne(book.authorId).name).toEqual('John Smith');
});

test('Factory - Create - Relationship - return a Factory from deep function (dotted)', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        'good.authorId'() {
            return Factory.get('author');
        },
        name: 'A book',
        year: 2014
    });

    var book = Factory.create('book');

    expect(Authors.findOne(book.good.authorId).name).toEqual('John Smith');
});

test('Factory - Create - Relationship - return a Factory from deep function', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        good: {
            authorId() {
                return Factory.get('author');
            }
        },
        name: 'A book',
        year: 2014
    });

    var book = Factory.create('book');

    expect(Authors.findOne(book.good.authorId).name).toEqual('John Smith');
});

test('Factory - Build - Sequence', () => {
    Factory.define('author', Authors, {
        name: 'John Smith',
        email(factory) {
            return factory.sequence(n => 'person' + n + '@example.com');
        }
    });

    var author = Factory.build('author');
    expect(author.email).toEqual('person1@example.com');
    var author2 = Factory.build('author');
    expect(author2.email).toEqual('person2@example.com');
});

test('Factory - Create - Sequence', () => {
    Authors.remove({});

    Factory.define('author', Authors, {
        name: 'John Smith',
        email(factory) {
            return factory.sequence(n => 'person' + n + '@example.com');
        }
    });

    var author = Factory.create('author');
    expect(author.email).toEqual('person1@example.com');
    var foundAuthors = Authors.find({ email: 'person1@example.com' });
    expect(foundAuthors).toHaveLength(1);

    var author2 = Factory.create('author');
    expect(author2.email).toEqual('person2@example.com');
    var foundAuthors2 = Authors.find({ email: 'person2@example.com' });
    expect(foundAuthors2).toHaveLength(1);
});

test('Factory - Build - Array with Factory', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        authorIds: [Factory.get('author'), 'PXm6dye7A8vgoB7uY']
    });

    const book = Factory.build('book');

    expect(book.authorIds).toHaveLength(2);
    expect(book.authorIds[0]).toHaveLength(17);
});

test('Factory - Build - Array with function returning a Factory', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        authorIds: [() => Factory.get('author'), 'PXm6dye7A8vgoB7uY']
    });

    const book = Factory.build('book');

    expect(book.authorIds).toHaveLength(2);
    expect(book.authorIds[0]).toHaveLength(17);
});

test('Factory - Build - Array with an object', () => {
    Factory.define('book', Books, {
        array: [{ objectInArray: true }]
    });

    const book = Factory.build('book');

    expect(book.array[0].objectInArray).toBe(true);
});

// Could possibly make this a feature:
// test("Factory - Build - Array with an object containing a function",  () => {
//   Factory.define('book', Books, {
//     array: [{objectInArrayWithFn: () => true}]
//   });

//   const book = Factory.build('book');

//   expect(book.array[0].objectInArrayWithFn, true);
// });

test('Factory - Tree - Basic', () => {
    Factory.define('author', Authors, {
        name: 'John Smith'
    });

    Factory.define('book', Books, {
        name: 'A book',
        author: Factory.get('author')
    });

    const book = Factory.tree('book');

    expect(book.author.name).toEqual('John Smith');
});

test('Factory - Build - With options', () => {
    Factory.define('author', Authors, {
        name: 'John Smith',
        books(factory, options = { bookCount: 2 }) {
            return _(options.bookCount).times(
                n => `${n + 1} book by ${this.name}`
            );
        }
    });

    const author = Factory.build('author', {}, { bookCount: 3 });

    expect(author.books).toHaveLength(3);
    expect(author.books).toEqual([
        '1 book by John Smith',
        '2 book by John Smith',
        '3 book by John Smith'
    ]);
});

test('Factory - Create - With options', () => {
    Factory.define('book', Books, {
        name: 'A book',
        pages(factory, options = { pageCount: 2 }) {
            return _.times(options.pageCount, n => `Page ${n + 1}`);
        }
    });

    const book = Factory.create('book', {}, { pageCount: 2 });

    expect(book.pages).toHaveLength(2);
    expect(book.pages).toEqual(['Page 1', 'Page 2']);
});
