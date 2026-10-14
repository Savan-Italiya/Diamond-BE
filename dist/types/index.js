"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerEntryType = exports.DealStatus = exports.MemoStatus = exports.MemoType = exports.DiamondStatus = exports.PartyType = void 0;
var PartyType;
(function (PartyType) {
    PartyType["BUYER"] = "BUYER";
    PartyType["SELLER"] = "SELLER";
    PartyType["BROKER"] = "BROKER";
    PartyType["PROCESSOR"] = "PROCESSOR";
})(PartyType || (exports.PartyType = PartyType = {}));
var DiamondStatus;
(function (DiamondStatus) {
    DiamondStatus["IN_STOCK"] = "IN_STOCK";
    DiamondStatus["SOLD"] = "SOLD";
    DiamondStatus["IN_PROCESS"] = "IN_PROCESS";
    DiamondStatus["MEMO"] = "MEMO";
})(DiamondStatus || (exports.DiamondStatus = DiamondStatus = {}));
var MemoType;
(function (MemoType) {
    MemoType["MEMO_GIVEN"] = "MEMO_GIVEN";
    MemoType["MEMO_RECEIVED"] = "MEMO_RECEIVED";
})(MemoType || (exports.MemoType = MemoType = {}));
var MemoStatus;
(function (MemoStatus) {
    MemoStatus["OPEN"] = "OPEN";
    MemoStatus["PARTIAL_RETURN"] = "PARTIAL_RETURN";
    MemoStatus["CLOSED"] = "CLOSED";
    MemoStatus["CONVERTED_TO_SALE"] = "CONVERTED_TO_SALE";
})(MemoStatus || (exports.MemoStatus = MemoStatus = {}));
var DealStatus;
(function (DealStatus) {
    DealStatus["UNPAID"] = "UNPAID";
    DealStatus["PARTIAL"] = "PARTIAL";
    DealStatus["SETTLED"] = "SETTLED";
    DealStatus["CANCELLED"] = "CANCELLED";
})(DealStatus || (exports.DealStatus = DealStatus = {}));
var LedgerEntryType;
(function (LedgerEntryType) {
    LedgerEntryType["DEBIT"] = "DEBIT";
    LedgerEntryType["CREDIT"] = "CREDIT";
})(LedgerEntryType || (exports.LedgerEntryType = LedgerEntryType = {}));
//# sourceMappingURL=index.js.map