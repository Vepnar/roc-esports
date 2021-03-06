'use strict';

const Datastore = require('@google-cloud/datastore');
const config = require('../../config');

// [START config]
const ds = Datastore({
    projectId: config.get('GCLOUD_PROJECT')
});

const KIND_ADMIN = "Admin";
const KIND_GAME = "Game";
const KIND_TOURNAMENT = "Tournament";

// [END config]

function fromDatastore (obj) {
    obj.id = obj[Datastore.KEY].id;
    return obj;
}

function toDatastore (obj, nonIndexed) {
    nonIndexed = nonIndexed || [];
    const results = [];
    Object.keys(obj).forEach((k) => {
        if (obj[k] === undefined) {
            return;
        }
        results.push({
            name: k,
            value: obj[k],
            excludeFromIndexes: nonIndexed.indexOf(k) !== -1
        });
    });
    return results;
}

function update(table, id, data, cb) {
    let key;
    if (id) {
        // parse existing id, 10 indicates it's a decimal number (radix)
        key = ds.key([table, parseInt(id, 10)]);

    } else {
        // new entity in datastore makes a new id.
        key = ds.key(table);
    }

    const entity = {
        key: key,
        // array with non-indexed fields
        data: toDatastore(data, [])
    };

    ds.save(
        entity,
        (err) => {
            data.id = entity.key.id;
            cb(err, err ? null : data);
        }
    );
}

function create (table, data, cb) {
    update(table, null, data, cb);
}


function _delete (table, id, cb) {
    const key = ds.key([table, parseInt(id, 10)]);
    ds.delete(key, cb);
}

// Lists all admins in the Datastore sorted alphabetically by name.
// The ``limit`` argument determines the maximum amount of results to
// return per page. The ``token`` argument allows requesting additional
// pages. The callback is invoked with ``(err, books, nextPageToken)``.
// [START list]
function listAdmins (limit, token, cb) {
    const q = ds.createQuery([KIND_ADMIN])
        .limit(limit)
        .order('name')
        .start(token);

    ds.runQuery(q, (err, entities, nextQuery) => {
        if (err) {
            cb(err);
            return;
        }
        const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
        cb(null, entities.map(fromDatastore), hasMore);
    });
}

function read(table, id, cb) {
    const key = ds.key([table, parseInt(id, 10)]);
    ds.get(key, (err, entity) => {
        if (!err && !entity) {
            err = {
                code: 404,
                message: 'Not found'
            };
        }
        if (err) {
            cb(err);
            return;
        }
        cb(null, fromDatastore(entity));
    });
}

function listGames (limit, token, cb) {
    const q = ds.createQuery([KIND_GAME])
        .limit(limit)
        .order('name')
        .start(token);

    ds.runQuery(q, (err, entities, nextQuery) => {
        if (err) {
            cb(err);
            return;
        }
        const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
        cb(null, entities.map(fromDatastore), hasMore);
    });
}

function listTournaments (limit, token, cb) {
    const q = ds.createQuery([KIND_TOURNAMENT])
        .limit(limit)
        .order('starttime')
        .start(token);

    ds.runQuery(q, (err, entities, nextQuery) => {
        if (err) {
            cb(err);
            return;
        }
        const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
        cb(null, entities.map(fromDatastore), hasMore);
    });
}

function readTournament (id, cb) {
    const key = ds.key([KIND_TOURNAMENT, parseInt(id, 10)]);
    ds.get(key, (err, entity) => {
        if (!err && !entity) {
            err = {
                code: 404,
                message: 'Not found'
            };
        }
        if (err) {
            cb(err);
            return;
        }
        cb(null, fromDatastore(entity));
    });
}



// [START exports]
module.exports = {
    create,
    read,
    update,
    delete: _delete,

    listAdmins,
    listGames,
    listTournaments,
};
// [END exports]
