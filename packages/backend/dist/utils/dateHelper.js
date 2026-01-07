"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.isOverdue = exports.daysBetween = exports.addDays = void 0;
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffTime = date2.getTime() - date1.getTime();
    return Math.round(diffTime / oneDay);
};
exports.daysBetween = daysBetween;
const isOverdue = (dueDate) => {
    return new Date() > dueDate;
};
exports.isOverdue = isOverdue;
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};
exports.formatDate = formatDate;
//# sourceMappingURL=dateHelper.js.map