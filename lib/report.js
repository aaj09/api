const Report = require('../models/report.js');
const auth = require('../lib/auth.js');

exports.invalid_request = () => {
    return {
        status: 400,
        message: 'Invalid request'
    };
};

/**
 * Get a report with the given ID
 *
 * @param id The ID of the report
 * @param done The callback with err and the report
 */
exports.get_report = (id, done) => {
    Report.findOne({id},
        'id symptoms diagnosis conclusion remark diagnosed_by prescription',
        (err, report) => {
            if (err) {
                done({status: 500, message: 'Internal error 013'}, null);
            } else if (report) {
                done(null, report);
            } else {
                done({status: 404, message: 'Not found'}, null);
            }
        });
};

/**
 * Add a new report
 *
 * @param report The report to be added
 * @param done The callback with the response
 */
exports.add_report = (report, done) => {
    Report.findOne({id: report.id}, (err, exist) => {
        if (err) {
            done({status: 500, message: 'Internal error 014'});
        }
        else if(exist) {
            done({status: 409, message: 'Report already exists'});
        }
        else {
            let new_report = new Report({
                id: report.id,
                symptoms: report.symptoms,
                diagnosis: report.diagnosis,
                conclusion: report.conclusion,
                remark: report.remark,
                '$pushAll': { prescription: report.prescription },
                '$pushAll': { diagnosed_by: report.diagnosed_by }
            });

            new_report.save((save_err) => {
                if (save_err) {
                    done({status: 500, message: 'Internal error 015'});
                } else {
                    done({status: 201, message: 'Report added'});
                }
            });
        }
    });
};

/**
 * Get all the reports
 *
 * @param options An object with size and page for pagination
 * @param done The callback with error and data
 */
exports.get_all_reports = (options, done) => {
    let size = parseInt((options.size) >= 0 ? options.size : 10);
    let page = parseInt((options.page) > 0 ? options.page : 1);
    let sort = options.sort || '_id';
    let order = (options.order === 'desc') ? -1 : 1;

    Report.
        find({}).
        select('id symptoms diagnosis conclusion remark diagonised_by \
            prescription').
        sort({sort: order}).
        skip((page - 1) * size).
        limit(size).
        exec((err, reports) => {
            if (err) {
                done({status: 500, message: 'Internal error 016'}, null);
            } else {
                let data = {
                    meta: {
                        next: ( reports.length === size ) ?
                        encodeURI('/reports?page=' + (page + 1)) : null,
                        prev: ( page > 1 ) ?
                        encodeURI('/reports?page=' + (page - 1)) : null
                    },
                    reports
                };
                done(null, data);
            }
        });
};

/**
 * Delete an report
 *
 * @param id The id of the report to be deleted.
 * @param done The callback with response
 */
exports.remove_report = (id, done) => {
    Report.remove({id}, (err) => {
        done({status: 200, message: 'Report deleted'});
    });
};

/**
 * Update report details
 *
 * @param id The id of the report to be updated
 * @param data An object with the parameters to change
 * @param done The callback with err and response
 */
exports.update_report = (id, data, done) => {
    Report.findOne({id}, (err, report) => {
        if (err || !report) {
            done({status: 404, message: 'Report not found'}, null);
        } else {
            for (var prop in data) {
                if (report[prop]) { report[prop] = data[prop]; }
            }
            report.save((err) => {
                if (err) {
                    done({status: 500, message: 'Internal error 017'}, null);
                } else {
                    done(null, {status: 200, message: 'Report updated'});
                }
            });
        }
    });
};
