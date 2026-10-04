// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// src/data/initialData.ts
var INITIAL_STUDENTS = [
  // TỔ 1 (10 HS)
  { id: "hs_01", stt: 1, name: "Nguy\u1EC5n \u0110\u1EE9c Minh", gender: "Nam", birthDate: "2011-04-12", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 1, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "L\u1EDBp tr\u01B0\u1EDFng", parentName: "Nguy\u1EC5n \u0110\u1EE9c H\xF9ng", parentPhone: "0912345601", notes: "G\u01B0\u01A1ng m\u1EABu, h\u1ECDc gi\u1ECFi to\xE0n di\u1EC7n" },
  { id: "hs_02", stt: 2, name: "V\u0169 Qu\u1ED1c B\u1EA3o", gender: "Nam", birthDate: "2011-08-20", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "T\u1ED5 tr\u01B0\u1EDFng", parentName: "V\u0169 V\u0103n Ki\xEAn", parentPhone: "0912345602", notes: "N\u0103ng n\u1ED5, tr\xE1ch nhi\u1EC7m cao" },
  { id: "hs_03", stt: 3, name: "Ho\xE0ng Lan Anh", gender: "N\u1EEF", birthDate: "2011-02-15", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "T\u1ED5 ph\xF3", parentName: "Ho\xE0ng V\u0103n Th\u1EAFng", parentPhone: "0912345603" },
  { id: "hs_04", stt: 4, name: "Nguy\u1EC5n V\u0103n An", gender: "Nam", birthDate: "2011-05-18", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 2, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Nguy\u1EC5n V\u0103n B\xECnh", parentPhone: "0912345604" },
  { id: "hs_05", stt: 5, name: "Tr\u1EA7n Qu\u1EF3nh Chi", gender: "N\u1EEF", birthDate: "2011-10-09", birthPlace: "H\xE0 N\u1ED9i", permanentAddress: "Th\xF4n Nguy\u1EC7t \u0110\u1EE9c, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Tr\u1EA7n V\u0103n H\u1EA3i", parentPhone: "0912345605" },
  { id: "hs_06", stt: 6, name: "\u0110\u1EB7ng Tu\u1EA5n D\u0169ng", gender: "Nam", birthDate: "2011-11-23", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 1, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "Th\xE0nh vi\xEAn", parentName: "\u0110\u1EB7ng V\u0103n L\xE2m", parentPhone: "0912345606" },
  { id: "hs_07", stt: 7, name: "L\xEA Th\xF9y Dung", gender: "N\u1EEF", birthDate: "2011-03-30", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "Th\xE0nh vi\xEAn", parentName: "L\xEA V\u0103n C\u01B0\u1EDDng", parentPhone: "0912345607" },
  { id: "hs_08", stt: 8, name: "Ph\u1EA1m Ti\u1EBFn \u0110\u1EA1t", gender: "Nam", birthDate: "2011-07-14", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Ph\u1EA1m V\u0103n H\u01B0ng", parentPhone: "0912345608" },
  { id: "hs_09", stt: 9, name: "V\u0169 Th\u1ECB Di\u1EC5m H\u01B0\u01A1ng", gender: "N\u1EEF", birthDate: "2011-09-05", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "Th\xE0nh vi\xEAn", parentName: "V\u0169 \u0110\xECnh Tr\u1ECDng", parentPhone: "0912345609" },
  { id: "hs_10", stt: 10, name: "B\xF9i \u0110\u1EE9c Khang", gender: "Nam", birthDate: "2011-12-01", birthPlace: "B\u1EAFc Ninh", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 3, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 1, roleTitle: "Th\xE0nh vi\xEAn", parentName: "B\xF9i V\u0103n Tu\u1EA5n", parentPhone: "0912345610" },
  // TỔ 2 (10 HS)
  { id: "hs_11", stt: 11, name: "Tr\u1EA7n Th\u1ECB Mai Ph\u01B0\u01A1ng", gender: "N\u1EEF", birthDate: "2011-01-25", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "L\u1EDBp ph\xF3 h\u1ECDc t\u1EADp", parentName: "Tr\u1EA7n V\u0103n Nam", parentPhone: "0912345611", notes: "Ph\u1EE5 tr\xE1ch \u0111\xF4n \u0111\u1ED1c b\xE0i t\u1EADp" },
  { id: "hs_12", stt: 12, name: "\u0110\u1EB7ng Minh Qu\xE2n", gender: "Nam", birthDate: "2011-06-19", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 1, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "T\u1ED5 tr\u01B0\u1EDFng", parentName: "\u0110\u1EB7ng V\u0103n L\u1ED9c", parentPhone: "0912345612" },
  { id: "hs_13", stt: 13, name: "Ng\xF4 Th\xF9y Linh", gender: "N\u1EEF", birthDate: "2011-04-03", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "T\u1ED5 ph\xF3", parentName: "Ng\xF4 V\u0103n Th\xE0nh", parentPhone: "0912345613" },
  { id: "hs_14", stt: 14, name: "Phan Ho\xE0ng Long", gender: "Nam", birthDate: "2011-08-11", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 2, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Phan V\u0103n Ph\xFA", parentPhone: "0912345614" },
  { id: "hs_15", stt: 15, name: "\u0110inh Kh\xE1nh Ly", gender: "N\u1EEF", birthDate: "2011-02-28", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "Th\xE0nh vi\xEAn", parentName: "\u0110inh V\u0103n \u0110\u1EE9c", parentPhone: "0912345615" },
  { id: "hs_16", stt: 16, name: "Ho\xE0ng Nh\u1EADt Minh", gender: "Nam", birthDate: "2011-10-17", birthPlace: "H\xE0 N\u1ED9i", permanentAddress: "Th\xF4n Nguy\u1EC7t \u0110\u1EE9c, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Ho\xE0ng V\u0103n S\u01A1n", parentPhone: "0912345616" },
  { id: "hs_17", stt: 17, name: "Nguy\u1EC5n Tr\xE0 My", gender: "N\u1EEF", birthDate: "2011-12-12", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Nguy\u1EC5n V\u0103n \u0110\u1EA1t", parentPhone: "0912345617" },
  { id: "hs_18", stt: 18, name: "L\xEA Duy Nam", gender: "Nam", birthDate: "2011-05-07", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 1, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "Th\xE0nh vi\xEAn", parentName: "L\xEA V\u0103n Khoa", parentPhone: "0912345618" },
  { id: "hs_19", stt: 19, name: "T\u1EA1 B\u1EA3o Ng\u1ECDc", gender: "N\u1EEF", birthDate: "2011-09-22", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 3, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "Th\xE0nh vi\xEAn", parentName: "T\u1EA1 V\u0103n Quy\u1EBFt", parentPhone: "0912345619" },
  { id: "hs_20", stt: 20, name: "V\u0169 H\u1EEFu Ngh\u0129a", gender: "Nam", birthDate: "2011-03-16", birthPlace: "B\u1EAFc Ninh", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 2, roleTitle: "Th\xE0nh vi\xEAn", parentName: "V\u0169 V\u0103n H\u01B0ng", parentPhone: "0912345620" },
  // TỔ 3 (10 HS)
  { id: "hs_21", stt: 21, name: "L\xEA Ho\xE0ng Nam", gender: "Nam", birthDate: "2011-07-08", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "L\u1EDBp ph\xF3 n\u1EC1 n\u1EBFp", parentName: "L\xEA V\u0103n Ti\u1EBFn", parentPhone: "0912345621", notes: "Ki\u1EC3m tra s\u0129 s\u1ED1, \u0111\u1ED3ng ph\u1EE5c, v\u1EC7 sinh" },
  { id: "hs_22", stt: 22, name: "B\xF9i H\u1EA3i \u0110\u0103ng", gender: "Nam", birthDate: "2011-11-04", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 1, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "T\u1ED5 tr\u01B0\u1EDFng", parentName: "B\xF9i V\u0103n Sang", parentPhone: "0912345622" },
  { id: "hs_23", stt: 23, name: "\u0110\u1ED7 Ng\u1ECDc \xC1nh", gender: "N\u1EEF", birthDate: "2011-01-19", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "T\u1ED5 ph\xF3", parentName: "\u0110\u1ED7 V\u0103n C\u01B0\u01A1ng", parentPhone: "0912345623" },
  { id: "hs_24", stt: 24, name: "Nguy\u1EC5n Th\xE0nh Ph\xE1t", gender: "Nam", birthDate: "2011-06-27", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 2, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Nguy\u1EC5n V\u0103n Ph\xFAc", parentPhone: "0912345624" },
  { id: "hs_25", stt: 25, name: "L\u01B0\u01A1ng Thu Ph\u01B0\u01A1ng", gender: "N\u1EEF", birthDate: "2011-08-30", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "Th\xE0nh vi\xEAn", parentName: "L\u01B0\u01A1ng V\u0103n Th\xE1i", parentPhone: "0912345625" },
  { id: "hs_26", stt: 26, name: "Tr\u1ECBnh Minh Qu\xE2n", gender: "Nam", birthDate: "2011-04-14", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Nguy\u1EC7t \u0110\u1EE9c, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Tr\u1ECBnh V\u0103n Long", parentPhone: "0912345626" },
  { id: "hs_27", stt: 27, name: "Cao Nh\u01B0 Qu\u1EF3nh", gender: "N\u1EEF", birthDate: "2011-10-02", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 1, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Cao V\u0103n Khi\xEAm", parentPhone: "0912345627" },
  { id: "hs_28", stt: 28, name: "V\u0169 \u0110\u1EE9c S\u01A1n", gender: "Nam", birthDate: "2011-03-21", birthPlace: "B\u1EAFc Ninh", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "Th\xE0nh vi\xEAn", parentName: "V\u0169 V\u0103n H\u1EADu", parentPhone: "0912345628" },
  { id: "hs_29", stt: 29, name: "\u0110\xE0o Thanh T\xE2m", gender: "N\u1EEF", birthDate: "2011-05-13", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "Th\xE0nh vi\xEAn", parentName: "\u0110\xE0o V\u0103n Vinh", parentPhone: "0912345629" },
  { id: "hs_30", stt: 30, name: "H\xE0 Quang Th\u1EAFng", gender: "Nam", birthDate: "2011-09-18", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 3, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 3, roleTitle: "Th\xE0nh vi\xEAn", parentName: "H\xE0 V\u0103n Qu\xFD", parentPhone: "0912345630" },
  // TỔ 4 (11 HS)
  { id: "hs_31", stt: 31, name: "Ph\u1EA1m Thu H\xE0", gender: "N\u1EEF", birthDate: "2011-02-10", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "L\u1EDBp ph\xF3 v\u0103n th\u1EC3 m\u1EF9", parentName: "Ph\u1EA1m V\u0103n H\xF2a", parentPhone: "0912345631", notes: "Ph\u1EE5 tr\xE1ch phong tr\xE0o v\u0103n ngh\u1EC7 th\u1EC3 thao" },
  { id: "hs_32", stt: 32, name: "D\u01B0\u01A1ng Gia Huy", gender: "Nam", birthDate: "2011-08-05", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 1, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "T\u1ED5 tr\u01B0\u1EDFng", parentName: "D\u01B0\u01A1ng V\u0103n T\u1EA1o", parentPhone: "0912345632" },
  { id: "hs_33", stt: 33, name: "L\xFD Th\u1EA3o My", gender: "N\u1EEF", birthDate: "2011-12-29", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "T\u1ED5 ph\xF3", parentName: "L\xFD V\u0103n C\u1EA3nh", parentPhone: "0912345633" },
  { id: "hs_34", stt: 34, name: "T\u1EA1 Minh Tu\u1EA5n", gender: "Nam", birthDate: "2011-07-26", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 2, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "Th\xE0nh vi\xEAn", parentName: "T\u1EA1 V\u0103n Quy\u1EBFt", parentPhone: "0912345634" },
  { id: "hs_35", stt: 35, name: "Mai Ph\u01B0\u01A1ng Uy\xEAn", gender: "N\u1EEF", birthDate: "2011-04-18", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Nguy\u1EC7t \u0110\u1EE9c, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Mai V\u0103n Tuy\xEAn", parentPhone: "0912345635" },
  { id: "hs_36", stt: 36, name: "\u0110o\xE0n Quang Vinh", gender: "Nam", birthDate: "2011-06-03", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "Th\xE0nh vi\xEAn", parentName: "\u0110o\xE0n V\u0103n Chi\u1EBFn", parentPhone: "0912345636" },
  { id: "hs_37", stt: 37, name: "Ph\xF9ng H\u1EA3i Y\u1EBFn", gender: "N\u1EEF", birthDate: "2011-11-15", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n Y\xEAn Vi\xEAn, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Ph\xF9ng V\u0103n Thu\u1EADn", parentPhone: "0912345637" },
  { id: "hs_38", stt: 38, name: "Nguy\u1EC5n T\u1EA5n D\u0169ng", gender: "Nam", birthDate: "2011-01-08", birthPlace: "B\u1EAFc Giang", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 1, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Nguy\u1EC5n V\u0103n Ki\xEAn", parentPhone: "0912345638" },
  { id: "hs_39", stt: 39, name: "Ho\xE0ng Di\u1EC7u Linh", gender: "N\u1EEF", birthDate: "2011-03-24", birthPlace: "H\xE0 N\u1ED9i", permanentAddress: "Th\xF4n V\xE2n C\u1ED1c 3, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Ho\xE0ng V\u0103n Th\xECn", parentPhone: "0912345639" },
  { id: "hs_40", stt: 40, name: "L\xEA Anh Khoa", gender: "Nam", birthDate: "2011-09-12", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Th\u1ED5 H\xE0, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "Th\xE0nh vi\xEAn", parentName: "L\xEA V\u0103n Hi\u1EBFu", parentPhone: "0912345640" },
  { id: "hs_41", stt: 41, name: "Tr\u1ECBnh Tuy\u1EBFt Mai", gender: "N\u1EEF", birthDate: "2011-10-31", birthPlace: "Vi\u1EC7t Y\xEAn, B\u1EAFc Giang", permanentAddress: "Th\xF4n Nguy\u1EC7t \u0110\u1EE9c, X\xE3 V\xE2n H\xE0, Th\u1ECB x\xE3 Vi\u1EC7t Y\xEAn, T\u1EC9nh B\u1EAFc Giang", teamId: 4, roleTitle: "Th\xE0nh vi\xEAn", parentName: "Tr\u1ECBnh V\u0103n Long", parentPhone: "0912345641" }
];
var INITIAL_RULES = [
  // LỖI VI PHẠM (TRỪ)
  { id: "rule_t1", type: "tru", title: "\u0110i h\u1ECDc mu\u1ED9n", points: 2, category: "N\u1EC1 n\u1EBFp" },
  { id: "rule_t2", type: "tru", title: "Kh\xF4ng m\u1EB7c \u0111\xFAng \u0111\u1ED3ng ph\u1EE5c / thi\u1EBFu kh\u0103n qu\xE0ng", points: 2, category: "N\u1EC1 n\u1EBFp" },
  { id: "rule_t3", type: "tru", title: "Kh\xF4ng l\xE0m b\xE0i t\u1EADp v\u1EC1 nh\xE0", points: 3, category: "H\u1ECDc t\u1EADp" },
  { id: "rule_t4", type: "tru", title: "N\xF3i chuy\u1EC7n ri\xEAng / l\xE0m vi\u1EC7c ri\xEAng trong gi\u1EDD", points: 1, category: "H\u1ECDc t\u1EADp" },
  { id: "rule_t5", type: "tru", title: "Kh\xF4ng tr\u1EF1c nh\u1EADt / tr\u1EF1c nh\u1EADt b\u1EA9n", points: 3, category: "V\u1EC7 sinh - Tr\u1EF1c nh\u1EADt" },
  { id: "rule_t6", type: "tru", title: "M\u1EA5t tr\u1EADt t\u1EF1 khi x\u1EBFp h\xE0ng / ch\xE0o c\u1EDD", points: 2, category: "N\u1EC1 n\u1EBFp" },
  { id: "rule_t7", type: "tru", title: "Qu\xEAn s\xE1ch gi\xE1o khoa / \u0111\u1ED3 d\xF9ng h\u1ECDc t\u1EADp", points: 1, category: "H\u1ECDc t\u1EADp" },
  { id: "rule_t8", type: "tru", title: "Vi ph\u1EA1m n\u1ED9i quy nghi\xEAm tr\u1ECDng / g\xE2y g\u1ED5", points: 5, category: "N\u1EC1 n\u1EBFp" },
  { id: "rule_t9", type: "tru", title: "S\u1EED d\u1EE5ng \u0111i\u1EC7n tho\u1EA1i tr\xE1i quy \u0111\u1ECBnh", points: 4, category: "N\u1EC1 n\u1EBFp" },
  { id: "rule_t10", type: "tru", title: "V\u1EE9t r\xE1c b\u1EEBa b\xE3i trong l\u1EDBp/s\xE2n tr\u01B0\u1EDDng", points: 2, category: "V\u1EC7 sinh - Tr\u1EF1c nh\u1EADt" },
  // ĐIỂM CỘNG
  { id: "rule_c1", type: "cong", title: "Ph\xE1t bi\u1EC3u x\xE2y d\u1EF1ng b\xE0i s\xF4i n\u1ED5i", points: 1, category: "H\u1ECDc t\u1EADp" },
  { id: "rule_c2", type: "cong", title: "\u0110\u1EA1t \u0111i\u1EC3m ki\u1EC3m tra mi\u1EC7ng/15p t\u1EEB 9-10", points: 3, category: "H\u1ECDc t\u1EADp" },
  { id: "rule_c3", type: "cong", title: "Gi\xFAp \u0111\u1EE1 b\u1EA1n ti\u1EBFn b\u1ED9 trong h\u1ECDc t\u1EADp", points: 2, category: "H\u1ECDc t\u1EADp" },
  { id: "rule_c4", type: "cong", title: "Tham gia t\xEDch c\u1EF1c phong tr\xE0o / v\u0103n ngh\u1EC7", points: 2, category: "V\u0103n th\u1EC3 m\u1EF9" },
  { id: "rule_c5", type: "cong", title: "\u0110\u1EA1t gi\u1EA3i v\u0103n ngh\u1EC7, th\u1EC3 d\u1EE5c th\u1EC3 thao tr\u01B0\u1EDDng", points: 5, category: "V\u0103n th\u1EC3 m\u1EF9" },
  { id: "rule_c6", type: "cong", title: "T\xEDch c\u1EF1c tr\u1EF1c nh\u1EADt, gi\u1EEF g\xECn v\u1EC7 sinh chung", points: 2, category: "V\u1EC7 sinh - Tr\u1EF1c nh\u1EADt" },
  { id: "rule_c7", type: "cong", title: "Nh\u1EB7t \u0111\u01B0\u1EE3c c\u1EE7a r\u01A1i tr\u1EA3 l\u1EA1i ng\u01B0\u1EDDi m\u1EA5t", points: 5, category: "Ho\u1EA1t \u0111\u1ED9ng chung" },
  // BIỂU DƯƠNG
  { id: "rule_b1", type: "bieu_duong", title: "G\u01B0\u01A1ng s\xE1ng h\u1ECDc t\u1EADp xu\u1EA5t s\u1EAFc trong tu\u1EA7n", points: 3, category: "H\u1ECDc t\u1EADp" },
  { id: "rule_b2", type: "bieu_duong", title: "C\xF3 ti\u1EBFn b\u1ED9 v\u01B0\u1EE3t b\u1EADc v\u1EC1 \xFD th\u1EE9c v\xE0 b\xE0i t\u1EADp", points: 3, category: "H\u1ECDc t\u1EADp" },
  { id: "rule_b3", type: "bieu_duong", title: "H\xE0nh \u0111\u1ED9ng \u0111\u1EB9p - Gi\xFAp \u0111\u1EE1 ng\u01B0\u1EDDi kh\xE1c", points: 4, category: "Ho\u1EA1t \u0111\u1ED9ng chung" },
  { id: "rule_b4", type: "bieu_duong", title: "Ho\xE0n th\xE0nh xu\u1EA5t s\u1EAFc nhi\u1EC7m v\u1EE5 c\xE1n s\u1EF1 l\u1EDBp", points: 3, category: "N\u1EC1 n\u1EBFp" }
];
var INITIAL_ACCOUNTS = [
  { id: "acc_admin", username: "admin", passwordHash: "admin123", displayName: "C\xF4 Thu Th\u1EE7y (GVCN)", role: "admin", isLocked: false, createdAt: "2026-09-01T07:00:00Z" },
  { id: "acc_loptruong", username: "loptruong", passwordHash: "123456", displayName: "Nguy\u1EC5n \u0110\u1EE9c Minh (L\u1EDBp tr\u01B0\u1EDFng)", role: "lop_truong", isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_01", teamId: 1 },
  { id: "acc_loppho_ht", username: "loppho_ht", passwordHash: "123456", displayName: "Tr\u1EA7n Th\u1ECB Mai Ph\u01B0\u01A1ng (LP H\u1ECDc t\u1EADp)", role: "lop_pho_ht", isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_11", teamId: 2 },
  { id: "acc_loppho_nn", username: "loppho_nn", passwordHash: "123456", displayName: "L\xEA Ho\xE0ng Nam (LP N\u1EC1 n\u1EBFp)", role: "lop_pho_nn", isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_21", teamId: 3 },
  { id: "acc_totruong1", username: "totruong1", passwordHash: "123456", displayName: "V\u0169 Qu\u1ED1c B\u1EA3o (T\u1ED5 tr\u01B0\u1EDFng 1)", role: "to_truong", teamId: 1, isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_02" },
  { id: "acc_totruong2", username: "totruong2", passwordHash: "123456", displayName: "\u0110\u1EB7ng Minh Qu\xE2n (T\u1ED5 tr\u01B0\u1EDFng 2)", role: "to_truong", teamId: 2, isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_12" },
  { id: "acc_totruong3", username: "totruong3", passwordHash: "123456", displayName: "B\xF9i H\u1EA3i \u0110\u0103ng (T\u1ED5 tr\u01B0\u1EDFng 3)", role: "to_truong", teamId: 3, isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_22" },
  { id: "acc_totruong4", username: "totruong4", passwordHash: "123456", displayName: "D\u01B0\u01A1ng Gia Huy (T\u1ED5 tr\u01B0\u1EDFng 4)", role: "to_truong", teamId: 4, isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_32" },
  { id: "acc_hocsinh", username: "hocsinh", passwordHash: "123456", displayName: "H\u1ECDc sinh Nguy\u1EC5n V\u0103n An", role: "hoc_sinh", isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_04", teamId: 1 },
  { id: "acc_phuhuynh", username: "phuhuynh", passwordHash: "123456", displayName: "Ph\u1EE5 huynh HS Nguy\u1EC5n V\u0103n An", role: "phu_huynh", isLocked: false, createdAt: "2026-09-01T07:00:00Z", studentId: "hs_04", teamId: 1 }
];
var INITIAL_TRANSACTIONS = [];
var INITIAL_ANNOUNCEMENTS = [
  {
    id: "ann_01",
    title: "K\u1EBF ho\u1EA1ch thi \u0111ua \u0111\u1EE3t 1 ch\xE0o m\u1EEBng ng\xE0y 20/10",
    content: "C\xE1c t\u1ED5 tr\u01B0\u1EDFng \u0111\xF4n \u0111\u1ED1c th\xE0nh vi\xEAn gi\u1EEF v\u1EEFng n\u1EC1 n\u1EBFp x\u1EBFp h\xE0ng, 100% \u0111eo kh\u0103n qu\xE0ng \u0111\u1ECF, kh\xF4ng vi ph\u1EA1m \u0111i mu\u1ED9n. L\u1EDBp ph\xF3 n\u1EC1 n\u1EBFp v\xE0 v\u0103n th\u1EC3 m\u1EF9 chu\u1EA9n b\u1ECB ti\u1EBFt m\u1EE5c v\u0103n ngh\u1EC7.",
    target: "all",
    priority: "urgent",
    createdAt: "2026-10-01T07:00:00Z",
    createdBy: "C\xF4 Thu Th\u1EE7y (GVCN)"
  },
  {
    id: "ann_02",
    title: "Nh\u1EAFc nh\u1EDF ki\u1EC3m tra v\u1EDF ghi v\xE0 b\xE0i t\u1EADp v\u1EC1 nh\xE0 m\xF4n To\xE1n, Anh",
    content: "L\u1EDBp ph\xF3 h\u1ECDc t\u1EADp Tr\u1EA7n Th\u1ECB Mai Ph\u01B0\u01A1ng ti\u1EBFn h\xE0nh ki\u1EC3m tra \u0111\u1ED9t xu\u1EA5t 15 ph\xFAt \u0111\u1EA7u gi\u1EDD s\xE1ng th\u1EE9 N\u0103m.",
    target: "cadres",
    priority: "important",
    createdAt: "2026-10-02T11:00:00Z",
    createdBy: "C\xF4 Thu Th\u1EE7y (GVCN)"
  },
  {
    id: "ann_03",
    title: "G\u1EEDi k\u1EBFt qu\u1EA3 r\xE8n luy\u1EC7n tu\u1EA7n 4 t\u1EDBi Qu\xFD Ph\u1EE5 huynh",
    content: "Tu\u1EA7n qua l\u1EDBp 9A1 \u0111\u1EA1t v\u1ECB tr\xED s\u1ED1 1 to\xE0n kh\u1ED1i v\u1EC1 thi \u0111ua n\u1EC1 n\u1EBFp. K\xEDnh mong ph\u1EE5 huynh ti\u1EBFp t\u1EE5c \u0111\u1ED9ng vi\xEAn c\xE1c con duy tr\xEC.",
    target: "parents",
    priority: "normal",
    createdAt: "2026-09-29T17:00:00Z",
    createdBy: "C\xF4 Thu Th\u1EE7y (GVCN)"
  }
];
var INITIAL_AUDIT_LOGS = [
  {
    id: "log_01",
    userId: "acc_admin",
    userName: "C\xF4 Thu Th\u1EE7y (GVCN)",
    role: "admin",
    action: "Kh\u1EDFi t\u1EA1o h\u1EC7 th\u1ED1ng",
    details: "Thi\u1EBFt l\u1EADp danh s\xE1ch 41 h\u1ECDc sinh L\u1EDBp 9A1 v\xE0 quy ch\u1EBF \u0111i\u1EC3m n\u0103m h\u1ECDc 2026\u20132027",
    timestamp: "2026-09-01T07:00:00Z"
  },
  {
    id: "log_02",
    userId: "acc_totruong1",
    userName: "V\u0169 Qu\u1ED1c B\u1EA3o",
    role: "to_truong",
    action: "Tr\u1EEB \u0111i\u1EC3m",
    details: "Tr\u1EEB 1 \u0111i\u1EC3m HS Ph\u1EA1m Ti\u1EBFn \u0110\u1EA1t do n\xF3i chuy\u1EC7n ri\xEAng",
    timestamp: "2026-10-03T08:00:00Z"
  },
  {
    id: "log_03",
    userId: "acc_loptruong",
    userName: "Nguy\u1EC5n \u0110\u1EE9c Minh",
    role: "lop_truong",
    action: "C\u1ED9ng \u0111i\u1EC3m",
    details: "C\u1ED9ng 2 \u0111i\u1EC3m HS Nguy\u1EC5n Tr\xE0 My do t\xEDch c\u1EF1c tr\u1EF1c nh\u1EADt",
    timestamp: "2026-10-03T08:10:00Z"
  }
];
var INITIAL_CAMPAIGNS = [];
var INITIAL_EVALUATIONS = [];
var INITIAL_APP_DATA = {
  config: {
    schoolName: "THCS V\xE2n H\xE0 2",
    className: "9A1",
    schoolYear: "2026\u20132027",
    teacherName: "Nguy\u1EC5n Th\u1ECB Thu Th\u1EE7y",
    totalStudents: 41,
    startDate: "2026-09-07",
    basePoints: 100,
    maxPoints: 150,
    minPoints: 0,
    requireApproval: false,
    // Mặc định lưu ngay, có thể chuyển sang kiểm duyệt
    allowStudentViewRank: true,
    allowParentViewRank: true,
    currentWeek: 4,
    currentMonth: 10
  },
  students: INITIAL_STUDENTS,
  rules: INITIAL_RULES,
  transactions: INITIAL_TRANSACTIONS,
  accounts: INITIAL_ACCOUNTS,
  announcements: INITIAL_ANNOUNCEMENTS,
  auditLogs: INITIAL_AUDIT_LOGS,
  campaigns: INITIAL_CAMPAIGNS,
  evaluations: INITIAL_EVALUATIONS
};

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DATA_DIR = process.env.NODE_ENV === "production" ? "/tmp/data" : path.join(__dirname, "data");
var BACKUP_DIR = path.join(DATA_DIR, "backups");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
var AppDataSchema = new mongoose.Schema({
  config: Object,
  students: Array,
  rules: Array,
  transactions: Array,
  accounts: Array,
  announcements: Array,
  auditLogs: Array,
  campaigns: Array,
  evaluations: Array
}, { strict: false });
var AppDataModel = mongoose.model("AppData", AppDataSchema);
var dbData;
async function loadDatabaseAsync() {
  let loadedData = JSON.parse(JSON.stringify(INITIAL_APP_DATA));
  try {
    if (mongoose.connection.readyState === 1) {
      let doc = await AppDataModel.findOne();
      if (!doc) {
        doc = new AppDataModel(INITIAL_APP_DATA);
        await doc.save();
      } else {
        loadedData = doc.toObject();
      }
    }
  } catch (err) {
    console.error("L\u1ED7i \u0111\u1ECDc MongoDB:", err);
  }
  if (!loadedData.accounts || loadedData.accounts.length === 0) {
    const localFile = path.join(DATA_DIR, "database.json");
    if (fs.existsSync(localFile)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(localFile, "utf8"));
        if (fileContent && fileContent.accounts) {
          loadedData = fileContent;
        }
      } catch (e) {
        console.warn("L\u1ED7i \u0111\u1ECDc file database.json c\u1EE5c b\u1ED9:", e);
      }
    }
  }
  if (!loadedData.accounts || loadedData.accounts.length === 0) {
    loadedData.accounts = JSON.parse(JSON.stringify(INITIAL_APP_DATA.accounts));
  } else {
    let adminAcc = loadedData.accounts.find((a) => a.username.toLowerCase() === "admin");
    if (!adminAcc) {
      adminAcc = {
        id: "acc_admin",
        username: "admin",
        passwordHash: "admin123",
        displayName: "C\xF4 Thu Th\u1EE7y (GVCN)",
        role: "admin",
        isLocked: false,
        createdAt: "2026-09-01T07:00:00Z"
      };
      loadedData.accounts.unshift(adminAcc);
    } else {
      adminAcc.isLocked = false;
      adminAcc.role = "admin";
    }
  }
  return loadedData;
}
function saveDatabase(data) {
  try {
    const localFile = path.join(DATA_DIR, "database.json");
    fs.writeFileSync(localFile, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
  }
  if (mongoose.connection.readyState === 1) {
    AppDataModel.updateOne({}, data, { upsert: true }).catch((err) => console.error("L\u1ED7i l\u01B0u MongoDB:", err));
  }
}
async function startServer() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://thuythcslongson_db_user:cxPhA1te9yJccHyj@quanlylop.6v49w0s.mongodb.net/?appName=quanlylop";
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3e3
    });
    console.log("\u2705 K\u1EBFt n\u1ED1i MongoDB Atlas th\xE0nh c\xF4ng!");
  } catch (err) {
    console.warn("\u26A0\uFE0F K\u1EBFt n\u1ED1i MongoDB Atlas th\u1EA5t b\u1EA1i (s\u1EED d\u1EE5ng Local Resilience an to\xE0n):", err?.message || err);
  }
  dbData = await loadDatabaseAsync();
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  const isDev = process.env.NODE_ENV !== "production";
  app.use(express.json({ limit: "10mb" }));
  const addAuditLog = (userId, userName, role, action, details) => {
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      role,
      action,
      details,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbData.auditLogs.unshift(log);
    if (dbData.auditLogs.length > 1e3) {
      dbData.auditLogs = dbData.auditLogs.slice(0, 1e3);
    }
  };
  app.get("/api/data", (_req, res) => {
    const safeData = {
      ...dbData,
      accounts: dbData.accounts.map((acc) => ({
        ...acc,
        passwordHash: "***"
      }))
    };
    res.json(safeData);
  });
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp t\xEAn \u0111\u0103ng nh\u1EADp v\xE0 m\u1EADt kh\u1EA9u." });
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    if (!dbData.accounts || dbData.accounts.length === 0) {
      dbData.accounts = JSON.parse(JSON.stringify(INITIAL_APP_DATA.accounts));
    }
    let account = dbData.accounts.find((a) => a.username.toLowerCase() === cleanUser);
    if (!account && cleanUser === "admin") {
      account = {
        id: "acc_admin",
        username: "admin",
        passwordHash: "admin123",
        displayName: "C\xF4 Thu Th\u1EE7y (GVCN)",
        role: "admin",
        isLocked: false,
        createdAt: "2026-09-01T07:00:00Z"
      };
      dbData.accounts.unshift(account);
      saveDatabase(dbData);
    }
    if (!account) return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c." });
    const isMatch = account.passwordHash === cleanPass;
    if (!isMatch) return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c." });
    if (account.isLocked) return res.status(403).json({ error: "T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n \u0111\xE3 b\u1ECB kh\xF3a. Vui l\xF2ng li\xEAn h\u1EC7 Gi\xE1o vi\xEAn ch\u1EE7 nhi\u1EC7m." });
    account.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
    saveDatabase(dbData);
    addAuditLog(account.id, account.displayName, account.role, "\u0110\u0103ng nh\u1EADp", `\u0110\u0103ng nh\u1EADp th\xE0nh c\xF4ng v\xE0o h\u1EC7 th\u1ED1ng`);
    const safeUser = { ...account, passwordHash: void 0 };
    res.json({ user: safeUser, token: `token_${account.id}_${Date.now()}` });
  });
  app.post("/api/auth/change-password", (req, res) => {
    const { userId, oldPassword, oldPass, newPassword, newPass, isAdminReset } = req.body;
    const currentOldPass = (oldPassword !== void 0 ? oldPassword : oldPass) || "";
    const currentNewPass = (newPassword !== void 0 ? newPassword : newPass) || "";
    const account = dbData.accounts.find((a) => a.id === userId);
    if (!account) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n." });
    if (!isAdminReset) {
      const isOldMatch = account.passwordHash === currentOldPass;
      if (!isOldMatch) {
        return res.status(400).json({ error: "M\u1EADt kh\u1EA9u c\u0169 kh\xF4ng \u0111\xFAng." });
      }
    }
    if (!currentNewPass || currentNewPass.length < 4) return res.status(400).json({ error: "M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 4 k\xFD t\u1EF1." });
    account.passwordHash = currentNewPass;
    saveDatabase(dbData);
    addAuditLog(userId, account.displayName, account.role, "\u0110\u1ED5i m\u1EADt kh\u1EA9u", "\u0110\xE3 thay \u0111\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng");
    res.json({ success: true, message: "\u0110\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng." });
  });
  app.put("/api/auth/profile", (req, res) => {
    const { userId, displayName, phone, email, notes, title } = req.body;
    const account = dbData.accounts.find((a) => a.id === userId);
    if (!account) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n ng\u01B0\u1EDDi d\xF9ng." });
    if (displayName && displayName.trim()) {
      account.displayName = displayName.trim();
      if (account.role === "admin") dbData.config.teacherName = displayName.trim();
    }
    if (phone !== void 0) account.phone = phone.trim();
    if (email !== void 0) account.email = email.trim();
    if (notes !== void 0) account.notes = notes.trim();
    if (title !== void 0) account.title = title.trim();
    saveDatabase(dbData);
    addAuditLog(userId, account.displayName, account.role, "C\u1EADp nh\u1EADt th\xF4ng tin", "C\u1EADp nh\u1EADt th\xF4ng tin c\xE1 nh\xE2n");
    res.json({ success: true, user: { ...account, passwordHash: "***" } });
  });
  app.post("/api/transactions", (req, res) => {
    const { studentId, type, title, points, category, notes, userId, userRole, userName, teamId, weekNumber, month, occurredDate, dayOfWeek } = req.body;
    if (!studentId || !title || points === void 0 || !type) return res.status(400).json({ error: "Thi\u1EBFu th\xF4ng tin giao d\u1ECBch \u0111i\u1EC3m." });
    const student = dbData.students.find((s) => s.id === studentId);
    if (!student) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ECDc sinh." });
    if (userRole === "to_truong" && teamId && student.teamId !== teamId) {
      return res.status(403).json({ error: "T\u1ED5 tr\u01B0\u1EDFng ch\u1EC9 \u0111\u01B0\u1EE3c c\u1ED9ng/tr\u1EEB \u0111i\u1EC3m cho h\u1ECDc sinh thu\u1ED9c t\u1ED5 c\u1EE7a m\xECnh." });
    }
    const status = dbData.config.requireApproval && userRole !== "admin" ? "pending" : "approved";
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const newTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      studentName: student.name,
      teamId: student.teamId,
      type,
      title,
      points: Number(points),
      category: category || "Kh\xE1c",
      notes: notes || "",
      createdByUserId: userId || "unknown",
      createdByRole: userRole || "cadre",
      createdByName: userName || "C\xE1n s\u1EF1",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      occurredDate: occurredDate || todayStr,
      dayOfWeek: dayOfWeek || "Th\u1EE9 Hai",
      weekNumber: weekNumber || dbData.config.currentWeek,
      month: month || dbData.config.currentMonth,
      status,
      reviewedBy: status === "approved" && userRole === "admin" ? userName : void 0,
      reviewedAt: status === "approved" && userRole === "admin" ? (/* @__PURE__ */ new Date()).toISOString() : void 0
    };
    dbData.transactions.unshift(newTx);
    saveDatabase(dbData);
    const actionName = type === "tru" ? "Tr\u1EEB \u0111i\u1EC3m" : type === "cong" ? "C\u1ED9ng \u0111i\u1EC3m" : "Bi\u1EC3u d\u01B0\u01A1ng";
    addAuditLog(userId, userName, userRole, actionName, `${actionName} (${points > 0 ? "+" : ""}${points} \u0111i\u1EC3m) cho h\u1ECDc sinh ${student.name} - ${title}`);
    res.json({ success: true, transaction: newTx });
  });
  app.post("/api/transactions/review", (req, res) => {
    const { ids, action, adminName } = req.body;
    if (!ids || !Array.isArray(ids) || !action) return res.status(400).json({ error: "D\u1EEF li\u1EC7u duy\u1EC7t kh\xF4ng h\u1EE3p l\u1EC7." });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let count = 0;
    dbData.transactions.forEach((tx) => {
      if (ids.includes(tx.id)) {
        tx.status = action === "approve" ? "approved" : "rejected";
        tx.reviewedBy = adminName || "Gi\xE1o vi\xEAn";
        tx.reviewedAt = now;
        count++;
      }
    });
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "Duy\u1EC7t \u0111i\u1EC3m", `${action === "approve" ? "Duy\u1EC7t" : "T\u1EEB ch\u1ED1i"} ${count} giao d\u1ECBch \u0111i\u1EC3m`);
    res.json({ success: true, count });
  });
  app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const index = dbData.transactions.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: "Giao d\u1ECBch kh\xF4ng t\u1ED3n t\u1EA1i." });
    const deleted = dbData.transactions.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a \u0111i\u1EC3m", `X\xF3a giao d\u1ECBch: ${deleted.title} c\u1EE7a HS ${deleted.studentName}`);
    res.json({ success: true });
  });
  app.post("/api/transactions/clear-period", (req, res) => {
    const { type, value, adminName } = req.body;
    if (!type || value === void 0) return res.status(400).json({ error: "Thi\u1EBFu th\xF4ng tin k\u1EF3 c\u1EA7n x\xF3a thi \u0111ua (tu\u1EA7n ho\u1EB7c th\xE1ng)." });
    const val = Number(value);
    const initialCount = dbData.transactions.length;
    if (type === "week") {
      dbData.transactions = dbData.transactions.filter((t) => t.weekNumber !== val);
      const deletedCount = initialCount - dbData.transactions.length;
      saveDatabase(dbData);
      addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a thi \u0111ua tu\u1EA7n", `X\xF3a to\xE0n b\u1ED9 ${deletedCount} \u0111i\u1EC3m thi \u0111ua c\u1EE7a Tu\u1EA7n ${val}`);
      return res.json({ success: true, deletedCount, message: `\u0110\xE3 x\xF3a ${deletedCount} l\u01B0\u1EE3t \u0111i\u1EC3m c\u1EE7a Tu\u1EA7n ${val}.` });
    } else if (type === "month") {
      dbData.transactions = dbData.transactions.filter((t) => t.month !== val);
      const deletedCount = initialCount - dbData.transactions.length;
      saveDatabase(dbData);
      addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a thi \u0111ua th\xE1ng", `X\xF3a to\xE0n b\u1ED9 ${deletedCount} \u0111i\u1EC3m thi \u0111ua c\u1EE7a Th\xE1ng ${val}`);
      return res.json({ success: true, deletedCount, message: `\u0110\xE3 x\xF3a ${deletedCount} l\u01B0\u1EE3t \u0111i\u1EC3m c\u1EE7a Th\xE1ng ${val}.` });
    }
    res.status(400).json({ error: "Lo\u1EA1i k\u1EF3 kh\xF4ng h\u1EE3p l\u1EC7 (ch\u1EC9 week ho\u1EB7c month)." });
  });
  app.post("/api/students", (req, res) => {
    const { name, gender, birthDate, birthPlace, permanentAddress, teamId, roleTitle, parentName, parentPhone, notes, adminName } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "T\xEAn h\u1ECDc sinh l\xE0 b\u1EAFt bu\u1ED9c." });
    const nextStt = dbData.students.length > 0 ? Math.max(...dbData.students.map((s) => s.stt)) + 1 : 1;
    const assignedTeam = teamId !== void 0 && teamId !== null && teamId !== "" ? Number(teamId) : 0;
    const newStudent = {
      id: `hs_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      stt: nextStt,
      name: name.trim(),
      gender: gender || "Nam",
      birthDate: birthDate || "",
      birthPlace: birthPlace ? birthPlace.trim() : "",
      permanentAddress: permanentAddress ? permanentAddress.trim() : "",
      teamId: assignedTeam,
      roleTitle: roleTitle || "Th\xE0nh vi\xEAn",
      parentName: parentName || "",
      parentPhone: parentPhone || "",
      notes: notes || ""
    };
    dbData.students.push(newStudent);
    dbData.config.totalStudents = dbData.students.length;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "Th\xEAm h\u1ECDc sinh", `Th\xEAm h\u1ECDc sinh m\u1EDBi: ${newStudent.name} (${newStudent.teamId > 0 ? "T\u1ED5 " + newStudent.teamId : "Ch\u01B0a ph\xE2n t\u1ED5"})`);
    res.json({ success: true, student: newStudent });
  });
  app.put("/api/students/:id", (req, res) => {
    const { id } = req.params;
    const student = dbData.students.find((s) => s.id === id);
    if (!student) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ECDc sinh." });
    const { name, gender, birthDate, birthPlace, permanentAddress, teamId, roleTitle, parentName, parentPhone, notes, adminName } = req.body;
    if (name) student.name = name.trim();
    if (gender) student.gender = gender;
    if (birthDate !== void 0) student.birthDate = birthDate;
    if (birthPlace !== void 0) student.birthPlace = birthPlace ? birthPlace.trim() : "";
    if (permanentAddress !== void 0) student.permanentAddress = permanentAddress ? permanentAddress.trim() : "";
    if (teamId !== void 0) student.teamId = Number(teamId);
    if (roleTitle !== void 0) student.roleTitle = roleTitle;
    if (parentName !== void 0) student.parentName = parentName;
    if (parentPhone !== void 0) student.parentPhone = parentPhone;
    if (notes !== void 0) student.notes = notes;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "C\u1EADp nh\u1EADt h\u1ECDc sinh", `C\u1EADp nh\u1EADt th\xF4ng tin h\u1ECDc sinh: ${student.name}`);
    res.json({ success: true, student });
  });
  app.delete("/api/students/:id", (req, res) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const index = dbData.students.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ECDc sinh." });
    const deleted = dbData.students.splice(index, 1)[0];
    dbData.config.totalStudents = dbData.students.length;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a h\u1ECDc sinh", `X\xF3a h\u1ECDc sinh: ${deleted.name}`);
    res.json({ success: true });
  });
  app.delete("/api/students", (req, res) => {
    const { adminName } = req.body;
    const count = dbData.students.length;
    dbData.students = [];
    dbData.config.totalStudents = 0;
    dbData.transactions = [];
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a to\xE0n b\u1ED9 h\u1ECDc sinh", `\u0110\xE3 x\xF3a to\xE0n b\u1ED9 ${count} h\u1ECDc sinh v\xE0 l\xE0m r\u1ED7ng danh s\xE1ch l\u1EDBp`);
    res.json({ success: true, count: 0 });
  });
  app.post("/api/students/auto-divide-teams", (req, res) => {
    const { mode, adminName } = req.body;
    const total = dbData.students.length;
    if (total === 0) return res.status(400).json({ error: "L\u1EDBp ch\u01B0a c\xF3 h\u1ECDc sinh n\xE0o \u0111\u1EC3 chia t\u1ED5." });
    if (mode === "sequential") {
      const perTeam = Math.ceil(total / 4);
      dbData.students.forEach((s, index) => {
        s.teamId = Math.min(4, Math.floor(index / perTeam) + 1);
      });
    } else if (mode === "balance_gender") {
      const males = dbData.students.filter((s) => s.gender === "Nam");
      const females = dbData.students.filter((s) => s.gender !== "Nam");
      males.forEach((s, idx) => {
        s.teamId = idx % 4 + 1;
      });
      females.forEach((s, idx) => {
        s.teamId = idx % 4 + 1;
      });
    } else {
      dbData.students.forEach((s, index) => {
        s.teamId = index % 4 + 1;
      });
    }
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "Chia t\u1ED5 t\u1EF1 \u0111\u1ED9ng", `T\u1EF1 \u0111\u1ED9ng chia ${total} h\u1ECDc sinh v\xE0o 4 t\u1ED5 (c\xE1ch chia: ${mode || "v\xF2ng tr\xF2n"})`);
    res.json({ success: true, students: dbData.students });
  });
  app.post("/api/students/batch-assign-team", (req, res) => {
    const { studentIds, targetTeamId, adminName } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || !targetTeamId) return res.status(400).json({ error: "D\u1EEF li\u1EC7u \u0111\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7." });
    let updatedCount = 0;
    dbData.students.forEach((s) => {
      if (studentIds.includes(s.id)) {
        s.teamId = Number(targetTeamId);
        updatedCount++;
      }
    });
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "G\xE1n t\u1ED5 h\xE0ng lo\u1EA1t", `\u0110\xE3 chuy\u1EC3n ${updatedCount} h\u1ECDc sinh v\u1EC1 T\u1ED5 ${targetTeamId}`);
    res.json({ success: true, updatedCount, students: dbData.students });
  });
  app.post("/api/students/batch-delete", (req, res) => {
    const { studentIds, adminName } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) return res.status(400).json({ error: "Danh s\xE1ch h\u1ECDc sinh c\u1EA7n x\xF3a kh\xF4ng h\u1EE3p l\u1EC7." });
    const beforeCount = dbData.students.length;
    dbData.students = dbData.students.filter((s) => !studentIds.includes(s.id));
    dbData.transactions = dbData.transactions.filter((t) => !studentIds.includes(t.studentId));
    dbData.config.totalStudents = dbData.students.length;
    const deletedCount = beforeCount - dbData.students.length;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a h\u1ECDc sinh h\xE0ng lo\u1EA1t", `\u0110\xE3 x\xF3a ${deletedCount} h\u1ECDc sinh kh\u1ECFi danh s\xE1ch l\u1EDBp`);
    res.json({ success: true, deletedCount });
  });
  app.post("/api/students/bulk-import", (req, res) => {
    const { students: newStudentsList, adminName } = req.body;
    if (!newStudentsList || !Array.isArray(newStudentsList)) return res.status(400).json({ error: "D\u1EEF li\u1EC7u \u0111\u1EA7u v\xE0o danh s\xE1ch kh\xF4ng h\u1EE3p l\u1EC7." });
    let nextStt = dbData.students.length > 0 ? Math.max(...dbData.students.map((s) => s.stt)) + 1 : 1;
    const addedStudents = [];
    newStudentsList.forEach((s) => {
      if (s.name && s.name.trim()) {
        const assignedTeam = s.teamId !== void 0 && s.teamId !== null && s.teamId !== "" ? Number(s.teamId) : 0;
        const student = {
          id: `hs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          stt: s.stt ? Number(s.stt) : nextStt++,
          name: s.name.trim(),
          gender: s.gender === "N\u1EEF" || s.gender === "nu" ? "N\u1EEF" : "Nam",
          birthDate: s.birthDate || "",
          birthPlace: s.birthPlace || s.placeOfBirth || s.noiSinh || "",
          permanentAddress: s.permanentAddress || s.thuongTru || s.address || s.noiThuongTru || "",
          teamId: assignedTeam,
          roleTitle: s.roleTitle || "Th\xE0nh vi\xEAn",
          parentName: s.parentName || "",
          parentPhone: s.parentPhone || "",
          notes: s.notes || ""
        };
        dbData.students.push(student);
        addedStudents.push(student);
      }
    });
    dbData.config.totalStudents = dbData.students.length;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "Nh\u1EADp danh s\xE1ch Excel", `Nh\u1EADp th\xEAm ${addedStudents.length} h\u1ECDc sinh t\u1EEB file Excel`);
    res.json({ success: true, count: addedStudents.length, added: addedStudents });
  });
  app.post("/api/rules", (req, res) => {
    const { type, title, points, category, adminName } = req.body;
    if (!type || !title || points === void 0) return res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp \u0111\u1EE7 th\xF4ng tin quy ch\u1EBF." });
    const newRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type,
      title: title.trim(),
      points: Math.abs(Number(points)),
      category: category || "Kh\xE1c"
    };
    dbData.rules.push(newRule);
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "Th\xEAm quy ch\u1EBF \u0111i\u1EC3m", `Th\xEAm quy ch\u1EBF: ${newRule.title} (${newRule.points} \u0111i\u1EC3m)`);
    res.json({ success: true, rule: newRule });
  });
  app.put("/api/rules/:id", (req, res) => {
    const { id } = req.params;
    const { type, title, points, category, adminName } = req.body;
    const rule = dbData.rules.find((r) => r.id === id);
    if (!rule) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y quy ch\u1EBF." });
    if (type) rule.type = type;
    if (title && title.trim()) rule.title = title.trim();
    if (points !== void 0) rule.points = Math.abs(Number(points));
    if (category) rule.category = category;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "C\u1EADp nh\u1EADt thang \u0111i\u1EC3m", `Ch\u1EC9nh s\u1EEDa quy ch\u1EBF: ${rule.title} (${rule.points} \u0111i\u1EC3m)`);
    res.json({ success: true, rule });
  });
  app.delete("/api/rules/:id", (req, res) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const index = dbData.rules.findIndex((r) => r.id === id);
    if (index === -1) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y quy ch\u1EBF." });
    const deleted = dbData.rules.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a quy ch\u1EBF", `X\xF3a quy ch\u1EBF: ${deleted.title}`);
    res.json({ success: true });
  });
  app.post("/api/accounts", (req, res) => {
    const { username, password, displayName, role, teamId, studentId, adminName } = req.body;
    if (!username || !password || !displayName || !role) return res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp \u0111\u1EE7 th\xF4ng tin t\xE0i kho\u1EA3n." });
    const cleanUser = username.trim().toLowerCase();
    if (dbData.accounts.some((a) => a.username.toLowerCase() === cleanUser)) {
      return res.status(400).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp \u0111\xE3 tr\xF9ng l\u1EB7p." });
    }
    const newAcc = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      username: cleanUser,
      passwordHash: password,
      displayName: displayName.trim(),
      role,
      teamId: teamId ? Number(teamId) : void 0,
      studentId: studentId || void 0,
      isLocked: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbData.accounts.push(newAcc);
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "T\u1EA1o t\xE0i kho\u1EA3n", `T\u1EA1o t\xE0i kho\u1EA3n m\u1EDBi: ${newAcc.username} (${newAcc.displayName})`);
    res.json({ success: true, account: { ...newAcc, passwordHash: "***" } });
  });
  app.put("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    const { username, displayName, role, teamId, studentId, phone, email, notes, title, password, isLocked, adminName } = req.body;
    const acc = dbData.accounts.find((a) => a.id === id);
    if (!acc) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n \u0111\u1EC3 ch\u1EC9nh s\u1EEDa." });
    if (username && username.trim()) {
      const cleanUser = username.trim().toLowerCase();
      const existing = dbData.accounts.find((a) => a.id !== id && a.username.toLowerCase() === cleanUser);
      if (existing) return res.status(400).json({ error: `T\xEAn \u0111\u0103ng nh\u1EADp "@${cleanUser}" \u0111\xE3 t\u1ED3n t\u1EA1i \u1EDF t\xE0i kho\u1EA3n kh\xE1c.` });
      acc.username = cleanUser;
    }
    if (displayName && displayName.trim()) {
      acc.displayName = displayName.trim();
      if (acc.role === "admin") dbData.config.teacherName = displayName.trim();
    }
    if (role) {
      if (acc.username === "admin" && role !== "admin") return res.status(400).json({ error: "Kh\xF4ng th\u1EC3 h\u1EA1 quy\u1EC1n t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB m\u1EB7c \u0111\u1ECBnh." });
      acc.role = role;
    }
    if (teamId !== void 0) acc.teamId = teamId ? Number(teamId) : void 0;
    if (studentId !== void 0) acc.studentId = studentId || void 0;
    if (phone !== void 0) acc.phone = phone.trim();
    if (email !== void 0) acc.email = email.trim();
    if (notes !== void 0) acc.notes = notes.trim();
    if (title !== void 0) acc.title = title.trim();
    if (isLocked !== void 0 && acc.username !== "admin") acc.isLocked = Boolean(isLocked);
    if (password && password.trim()) acc.passwordHash = password.trim();
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "S\u1EEDa t\xE0i kho\u1EA3n", `C\u1EADp nh\u1EADt t\xE0i kho\u1EA3n: @${acc.username} (${acc.displayName} - ${acc.role})`);
    res.json({ success: true, account: { ...acc, passwordHash: "***" } });
  });
  app.delete("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    const { adminName } = req.body || {};
    const index = dbData.accounts.findIndex((a) => a.id === id);
    if (index === -1) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n \u0111\u1EC3 x\xF3a." });
    const targetAcc = dbData.accounts[index];
    if (targetAcc.username === "admin") return res.status(400).json({ error: "Kh\xF4ng th\u1EC3 x\xF3a t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB g\u1ED1c (admin)." });
    if (targetAcc.role === "admin" && dbData.accounts.filter((a) => a.role === "admin").length <= 1) return res.status(400).json({ error: "Kh\xF4ng th\u1EC3 x\xF3a t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB vi\xEAn duy nh\u1EA5t c\xF2n l\u1EA1i." });
    const deleted = dbData.accounts.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a t\xE0i kho\u1EA3n", `X\xF3a v\u0129nh vi\u1EC5n t\xE0i kho\u1EA3n: @${deleted.username} (${deleted.displayName})`);
    res.json({ success: true, deletedId: id });
  });
  app.put("/api/accounts/:id/toggle-lock", (req, res) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const acc = dbData.accounts.find((a) => a.id === id);
    if (!acc) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n." });
    acc.isLocked = !acc.isLocked;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", acc.isLocked ? "Kh\xF3a t\xE0i kho\u1EA3n" : "M\u1EDF t\xE0i kho\u1EA3n", `\u0110\xE3 ${acc.isLocked ? "kh\xF3a" : "m\u1EDF kh\xF3a"} t\xE0i kho\u1EA3n: ${acc.username}`);
    res.json({ success: true, isLocked: acc.isLocked });
  });
  app.put("/api/accounts/:id/permissions", (req, res) => {
    const { id } = req.params;
    const { permissions, adminName } = req.body;
    const acc = dbData.accounts.find((a) => a.id === id);
    if (!acc) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n." });
    if (acc.role !== "admin" && permissions) {
      permissions.canDeletePoints = false;
      permissions.canDeletePeriodPoints = false;
      permissions.canDeleteStudents = false;
      permissions.canDeleteCampaign = false;
      permissions.canBackupRestore = false;
    }
    acc.permissions = permissions;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "C\u1EADp nh\u1EADt ph\xE2n quy\u1EC1n t\xE0i kho\u1EA3n", `C\u1EADp nh\u1EADt ph\xE2n quy\u1EC1n chi ti\u1EBFt cho t\xE0i kho\u1EA3n: ${acc.username} (${acc.displayName})`);
    res.json({ success: true, account: acc });
  });
  app.put("/api/config/role-permissions", (req, res) => {
    const { rolePermissions, adminName } = req.body;
    if (!rolePermissions || typeof rolePermissions !== "object") return res.status(400).json({ error: "D\u1EEF li\u1EC7u ma tr\u1EADn ph\xE2n quy\u1EC1n kh\xF4ng h\u1EE3p l\u1EC7." });
    Object.keys(rolePermissions).forEach((r) => {
      if (r !== "admin") {
        const rp = rolePermissions[r];
        if (rp) {
          rp.canDeletePoints = false;
          rp.canDeletePeriodPoints = false;
          rp.canDeleteStudents = false;
          rp.canDeleteCampaign = false;
          rp.canBackupRestore = false;
        }
      }
    });
    dbData.config.rolePermissions = rolePermissions;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "C\u1EADp nh\u1EADt ma tr\u1EADn ph\xE2n quy\u1EC1n", "C\u1EADp nh\u1EADt c\u1EA5u h\xECnh thi\u1EBFt l\u1EADp ph\xE2n quy\u1EC1n vai tr\xF2 chung cho to\xE0n l\u1EDBp");
    res.json({ success: true, rolePermissions: dbData.config.rolePermissions });
  });
  app.put("/api/config", (req, res) => {
    const { config, adminName } = req.body;
    if (!config) return res.status(400).json({ error: "D\u1EEF li\u1EC7u c\u1EA5u h\xECnh kh\xF4ng h\u1EE3p l\u1EC7." });
    dbData.config = { ...dbData.config, ...config };
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "C\u1EADp nh\u1EADt c\u1EA5u h\xECnh", "Thay \u0111\u1ED5i c\u1EA5u h\xECnh thi\u1EBFt l\u1EADp thi \u0111ua c\u1EA5p l\u1EDBp");
    res.json({ success: true, config: dbData.config });
  });
  app.post("/api/announcements", (req, res) => {
    const { title, content, target, priority, createdBy } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Ti\xEAu \u0111\u1EC1 v\xE0 n\u1ED9i dung th\xF4ng b\xE1o l\xE0 b\u1EAFt bu\u1ED9c." });
    const ann = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: title.trim(),
      content: content.trim(),
      target: target || "all",
      priority: priority || "normal",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      createdBy: createdBy || "C\xF4 Thu Th\u1EE7y (GVCN)"
    };
    dbData.announcements.unshift(ann);
    saveDatabase(dbData);
    addAuditLog("admin", createdBy || "GVCN", "admin", "T\u1EA1o th\xF4ng b\xE1o", `\u0110\u0103ng th\xF4ng b\xE1o m\u1EDBi: ${ann.title}`);
    res.json({ success: true, announcement: ann });
  });
  app.delete("/api/announcements/:id", (req, res) => {
    const { id } = req.params;
    const index = dbData.announcements.findIndex((a) => a.id === id);
    if (index !== -1) {
      dbData.announcements.splice(index, 1);
      saveDatabase(dbData);
    }
    res.json({ success: true });
  });
  app.get("/api/backup", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=SaoLuu_Lop9A1_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`);
    res.send(JSON.stringify(dbData, null, 2));
  });
  app.get("/api/backups", (_req, res) => {
    res.json({ backups: [] });
  });
  app.post("/api/backups/create", (req, res) => {
    res.status(400).json({ error: "T\xEDnh n\u0103ng sao l\u01B0u file c\u1EE5c b\u1ED9 \u0111\xE3 b\u1ECB v\xF4 hi\u1EC7u h\xF3a khi d\xF9ng MongoDB \u0111\xE1m m\xE2y." });
  });
  app.post("/api/backups/restore-snapshot", (req, res) => {
    res.status(400).json({ error: "T\xEDnh n\u0103ng kh\xF4i ph\u1EE5c file c\u1EE5c b\u1ED9 \u0111\xE3 b\u1ECB v\xF4 hi\u1EC7u h\xF3a." });
  });
  app.post("/api/backup/restore", (req, res) => {
    const { backupData, adminName } = req.body;
    if (!backupData || !backupData.config || !backupData.students) return res.status(400).json({ error: "File sao l\u01B0u kh\xF4ng \u0111\xFAng \u0111\u1ECBnh d\u1EA1ng c\u1EE7a \u1EE9ng d\u1EE5ng." });
    dbData = backupData;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "Kh\xF4i ph\u1EE5c d\u1EEF li\u1EC7u", "Kh\xF4i ph\u1EE5c th\xE0nh c\xF4ng to\xE0n b\u1ED9 d\u1EEF li\u1EC7u t\u1EEB file sao l\u01B0u t\u1EA3i l\xEAn");
    res.json({ success: true, message: "Kh\xF4i ph\u1EE5c d\u1EEF li\u1EC7u th\xE0nh c\xF4ng." });
  });
  app.post("/api/campaigns", (req, res) => {
    const { title, description, type, startDate, endDate, weekNumber, rewardPoints, bonusPoints, latePenaltyPoints, missPenaltyPoints, createdBy, createdRole, participants } = req.body;
    if (!title || !startDate || !endDate) return res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp \u0111\u1EE7 t\xEAn cu\xF4\u0323c thi/chi\xEA\u0301n di\u0323ch va\u0300 th\u01A1\u0300i gian b\u0103\u0301t \u0111\xE2\u0300u, k\xEA\u0301t thu\u0301c." });
    const studentParticipants = participants && participants.length > 0 ? participants : dbData.students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      teamId: s.teamId,
      status: "chua_nop"
    }));
    const newCamp = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: (description || "").trim(),
      type: type || "cuoc_thi",
      startDate,
      endDate,
      weekNumber: weekNumber ? Number(weekNumber) : dbData.config.currentWeek || 4,
      rewardPoints: rewardPoints !== void 0 ? Math.abs(Number(rewardPoints)) : 2,
      bonusPoints: bonusPoints !== void 0 ? Math.abs(Number(bonusPoints)) : 3,
      latePenaltyPoints: latePenaltyPoints !== void 0 ? Math.abs(Number(latePenaltyPoints)) : 1,
      missPenaltyPoints: missPenaltyPoints !== void 0 ? Math.abs(Number(missPenaltyPoints)) : 2,
      createdBy: createdBy || "Gi\xE1o vi\xEAn / C\xE1n s\u1EF1",
      createdRole: createdRole || "admin",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "active",
      pointsApplied: false,
      participants: studentParticipants
    };
    if (!dbData.campaigns) dbData.campaigns = [];
    dbData.campaigns.unshift(newCamp);
    saveDatabase(dbData);
    addAuditLog(newCamp.createdRole, newCamp.createdBy, newCamp.createdRole, "T\u1EA1o cu\u1ED9c thi/chi\u1EBFn d\u1ECBch", `T\u1EA1o ${newCamp.type === "cuoc_thi" ? "cu\u1ED9c thi" : newCamp.type === "chien_dich" ? "chi\u1EBFn d\u1ECBch" : "phong tr\xE0o m\u1EDBi"}: ${newCamp.title} (H\u1EA1n ch\xF3t: ${newCamp.endDate})`);
    res.json({ success: true, campaign: newCamp });
  });
  app.put("/api/campaigns/:id", (req, res) => {
    const { id } = req.params;
    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find((c) => c.id === id);
    if (!camp) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y cu\u1ED9c thi / chi\u1EBFn d\u1ECBch." });
    const { title, description, type, startDate, endDate, weekNumber, rewardPoints, bonusPoints, latePenaltyPoints, missPenaltyPoints, status, adminName } = req.body;
    if (title) camp.title = title.trim();
    if (description !== void 0) camp.description = description.trim();
    if (type) camp.type = type;
    if (startDate) camp.startDate = startDate;
    if (endDate) camp.endDate = endDate;
    if (weekNumber !== void 0) camp.weekNumber = Number(weekNumber);
    if (rewardPoints !== void 0) camp.rewardPoints = Math.abs(Number(rewardPoints));
    if (bonusPoints !== void 0) camp.bonusPoints = Math.abs(Number(bonusPoints));
    if (latePenaltyPoints !== void 0) camp.latePenaltyPoints = Math.abs(Number(latePenaltyPoints));
    if (missPenaltyPoints !== void 0) camp.missPenaltyPoints = Math.abs(Number(missPenaltyPoints));
    if (status) camp.status = status;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "C\xE1n s\u1EF1 c\u1EA5p cao", "admin", "C\u1EADp nh\u1EADt chi\u1EBFn d\u1ECBch", `C\u1EADp nh\u1EADt th\xF4ng tin chi\u1EBFn d\u1ECBch: ${camp.title}`);
    res.json({ success: true, campaign: camp });
  });
  app.put("/api/campaigns/:id/participant", (req, res) => {
    const { id } = req.params;
    const { studentId, status, note, submittedAt, updatedBy, customPoints, appliedDirectly, transactionId, pointsAwarded } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find((c) => c.id === id);
    if (!camp) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y cu\u1ED9c thi / chi\u1EBFn d\u1ECBch." });
    let p = camp.participants.find((part) => part.studentId === studentId);
    if (!p) {
      const student = dbData.students.find((s) => s.id === studentId);
      if (!student) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ECDc sinh." });
      p = {
        studentId: student.id,
        studentName: student.name,
        teamId: student.teamId,
        status: status || "chua_nop"
      };
      camp.participants.push(p);
    }
    if (status) p.status = status;
    if (note !== void 0) p.note = note;
    if (customPoints !== void 0) p.customPoints = customPoints;
    if (appliedDirectly !== void 0) p.appliedDirectly = appliedDirectly;
    if (transactionId !== void 0) p.transactionId = transactionId;
    if (pointsAwarded !== void 0) p.pointsAwarded = pointsAwarded;
    if (submittedAt !== void 0) {
      p.submittedAt = submittedAt;
    } else if (status === "da_nop" || status === "xuat_sac" || status === "nop_muon") {
      p.submittedAt = p.submittedAt || (/* @__PURE__ */ new Date()).toISOString();
    } else if (status === "chua_nop") {
      p.submittedAt = void 0;
    }
    saveDatabase(dbData);
    res.json({ success: true, participant: p });
  });
  app.put("/api/campaigns/:id/batch-participants", (req, res) => {
    const { id } = req.params;
    const { studentIds, status, note, customPoints } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find((c) => c.id === id);
    if (!camp) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y cu\u1ED9c thi / chi\u1EBFn d\u1ECBch." });
    if (!Array.isArray(studentIds) || studentIds.length === 0) return res.status(400).json({ error: "Vui l\xF2ng ch\u1ECDn \xEDt nh\u1EA5t 1 h\u1ECDc sinh." });
    let updatedCount = 0;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    studentIds.forEach((stId) => {
      let p = camp.participants.find((part) => part.studentId === stId);
      if (!p) {
        const student = dbData.students.find((s) => s.id === stId);
        if (student) {
          p = { studentId: student.id, studentName: student.name, teamId: student.teamId, status: status || "chua_nop" };
          camp.participants.push(p);
        }
      }
      if (p) {
        p.status = status;
        if (note !== void 0) p.note = note;
        if (customPoints !== void 0) p.customPoints = customPoints;
        if (status === "da_nop" || status === "xuat_sac" || status === "nop_muon") {
          p.submittedAt = p.submittedAt || nowIso;
        } else if (status === "chua_nop") {
          p.submittedAt = void 0;
        }
        updatedCount++;
      }
    });
    saveDatabase(dbData);
    res.json({ success: true, updatedCount });
  });
  app.post("/api/campaigns/:id/apply-points", (req, res) => {
    const { id } = req.params;
    const { includeUnsubmitted, adminName, adminRole, userId } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find((c) => c.id === id);
    if (!camp) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y cu\u1ED9c thi / chi\u1EBFn d\u1ECBch." });
    if (camp.pointsApplied) {
      const prevTxIds = new Set(camp.participants.map((p) => p.transactionId).filter(Boolean));
      dbData.transactions = dbData.transactions.filter((t) => !prevTxIds.has(t.id));
    }
    const typeLabelMap = {
      cuoc_thi: "Cu\u1ED9c thi",
      chien_dich: "Chi\u1EBFn d\u1ECBch",
      nop_bai: "N\u1ED9p b\xE0i",
      phong_trao: "Phong tr\xE0o",
      lao_dong_su_kien: "Lao \u0111\u1ED9ng / S\u1EF1 ki\u1EC7n"
    };
    const typeLabel = typeLabelMap[camp.type] || "Cu\u1ED9c thi / S\u1EF1 ki\u1EC7n";
    let appliedCount = 0;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const targetWeek = camp.weekNumber || dbData.config.currentWeek || 4;
    camp.participants.forEach((p) => {
      let signedPoints = 0;
      let statusDesc = "";
      let txType = "cong";
      const isLaoDong = camp.type === "lao_dong_su_kien";
      if (p.status === "da_nop") {
        signedPoints = p.customPoints !== void 0 ? p.customPoints : camp.rewardPoints;
        statusDesc = isLaoDong ? "Tham gia lao \u0111\u1ED9ng / s\u1EF1 ki\u1EC7n \u0111\xFAng gi\u1EDD" : "\u0110\xE3 n\u1ED9p \u0111\xFAng h\u1EA1n / Ho\xE0n th\xE0nh";
        txType = signedPoints < 0 ? "tru" : "cong";
      } else if (p.status === "xuat_sac") {
        signedPoints = p.customPoints !== void 0 ? p.customPoints : camp.rewardPoints + camp.bonusPoints;
        statusDesc = isLaoDong ? "Lao \u0111\u1ED9ng t\xEDch c\u1EF1c / Ho\xE0n th\xE0nh xu\u1EA5t s\u1EAFc" : "Ho\xE0n th\xE0nh xu\u1EA5t s\u1EAFc / \u0110\u1EA1t gi\u1EA3i cao";
        txType = "bieu_duong";
      } else if (p.status === "nop_muon") {
        signedPoints = p.customPoints !== void 0 ? -Math.abs(p.customPoints) : -camp.latePenaltyPoints;
        statusDesc = isLaoDong ? "\u0110i mu\u1ED9n trong bu\u1ED5i lao \u0111\u1ED9ng / s\u1EF1 ki\u1EC7n" : "N\u1ED9p mu\u1ED9n so v\u1EDBi quy \u0111\u1ECBnh";
        txType = "tru";
      } else if (p.status === "khong_tham_gia") {
        signedPoints = p.customPoints !== void 0 ? -Math.abs(p.customPoints) : -camp.missPenaltyPoints;
        statusDesc = isLaoDong ? "Kh\xF4ng \u0111i lao \u0111\u1ED9ng / v\u1EAFng m\u1EB7t s\u1EF1 ki\u1EC7n" : "Kh\xF4ng tham gia / Kh\xF4ng n\u1ED9p b\xE0i";
        txType = "tru";
      } else if (p.status === "chua_nop" && includeUnsubmitted) {
        signedPoints = p.customPoints !== void 0 ? -Math.abs(p.customPoints) : -camp.missPenaltyPoints;
        statusDesc = isLaoDong ? "Kh\xF4ng tham gia / v\u1EAFng m\u1EB7t" : "Qu\xE1 h\u1EA1n ch\u01B0a ho\xE0n th\xE0nh";
        txType = "tru";
      }
      if (signedPoints !== 0) {
        const student = dbData.students.find((s) => s.id === p.studentId);
        if (student) {
          const tx = {
            id: `tx_camp_${camp.id}_${p.studentId}_${Date.now()}`,
            studentId: p.studentId,
            studentName: student.name,
            teamId: student.teamId,
            type: txType,
            title: `[${typeLabel}: ${camp.title}] - ${statusDesc}`,
            points: signedPoints,
            category: camp.type === "nop_bai" ? "H\u1ECDc t\u1EADp" : camp.type === "lao_dong_su_kien" ? "Lao \u0111\u1ED9ng & V\u1EC7 sinh" : camp.type === "cuoc_thi" ? "V\u0103n th\u1EC3 m\u1EF9" : "Ho\u1EA1t \u0111\u1ED9ng chung",
            notes: p.note ? `${p.note} (Th\u1EDDi gian: ${camp.startDate || camp.endDate})` : `Ghi nh\u1EADn t\u1EEB ${camp.title}`,
            createdByUserId: userId || "acc_admin",
            createdByRole: adminRole || "admin",
            createdByName: adminName || "GVCN & C\xE1n s\u1EF1",
            createdAt: nowIso,
            occurredDate: camp.startDate || camp.endDate,
            dayOfWeek: "Th\u1EE9 Hai",
            weekNumber: targetWeek,
            month: dbData.config.currentMonth || 10,
            status: "approved",
            reviewedBy: adminName || "GVCN",
            reviewedAt: nowIso
          };
          dbData.transactions.unshift(tx);
          p.transactionId = tx.id;
          p.pointsAwarded = signedPoints;
          p.appliedDirectly = true;
          appliedCount++;
        }
      } else {
        p.transactionId = void 0;
        p.pointsAwarded = 0;
        p.appliedDirectly = false;
      }
    });
    camp.pointsApplied = true;
    camp.pointsAppliedAt = nowIso;
    saveDatabase(dbData);
    addAuditLog(adminRole || "admin", adminName || "GVCN", adminRole || "admin", "T\u1ED5ng k\u1EBFt chi\u1EBFn d\u1ECBch", `T\u1EF1 \u0111\u1ED9ng c\u1ED9ng/tr\u1EEB \u0111i\u1EC3m thi \u0111ua cho ${appliedCount} h\u1ECDc sinh tham gia: ${camp.title} (Tu\u1EA7n ${targetWeek})`);
    res.json({ success: true, appliedCount, campaign: camp });
  });
  app.post("/api/campaigns/:id/rollback-points", (req, res) => {
    const { id } = req.params;
    const { adminName } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find((c) => c.id === id);
    if (!camp) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y cu\u1ED9c thi / chi\u1EBFn d\u1ECBch." });
    const txIds = new Set(camp.participants.map((p) => p.transactionId).filter(Boolean));
    dbData.transactions = dbData.transactions.filter((t) => !txIds.has(t.id));
    camp.participants.forEach((p) => {
      p.transactionId = void 0;
      p.pointsAwarded = void 0;
    });
    camp.pointsApplied = false;
    camp.pointsAppliedAt = void 0;
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "H\u1EE7y \u0111i\u1EC3m chi\u1EBFn d\u1ECBch", `H\u1EE7y to\xE0n b\u1ED9 c\u1ED9ng/tr\u1EEB \u0111i\u1EC3m t\u1EF1 \u0111\u1ED9ng c\u1EE7a chi\u1EBFn d\u1ECBch: ${camp.title}`);
    res.json({ success: true, campaign: camp });
  });
  app.delete("/api/campaigns/:id", (req, res) => {
    const { id } = req.params;
    const { adminName } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    const index = dbData.campaigns.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y cu\u1ED9c thi / chi\u1EBFn d\u1ECBch." });
    const camp = dbData.campaigns[index];
    if (camp.pointsApplied) {
      const txIds = new Set(camp.participants.map((p) => p.transactionId).filter(Boolean));
      dbData.transactions = dbData.transactions.filter((t) => !txIds.has(t.id));
    }
    dbData.campaigns.splice(index, 1);
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a cu\u1ED9c thi/chi\u1EBFn d\u1ECBch", `\u0110\xE3 x\xF3a v\u0129nh vi\u1EC5n chi\u1EBFn d\u1ECBch: ${camp.title}`);
    res.json({ success: true });
  });
  app.post("/api/evaluations", (req, res) => {
    const { studentId, periodType, periodValue, periodLabel, content, category, rating, authorId, authorName, authorRole } = req.body;
    if (!studentId || !content || !content.trim()) return res.status(400).json({ error: "Vui l\xF2ng ch\u1ECDn h\u1ECDc sinh v\xE0 nh\u1EADp n\u1ED9i dung nh\u1EADn x\xE9t." });
    const student = dbData.students.find((s) => s.id === studentId);
    if (!student) return res.status(404).json({ error: "H\u1ECDc sinh kh\xF4ng t\u1ED3n t\u1EA1i." });
    const newEval = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      studentName: student.name,
      teamId: student.teamId,
      periodType: periodType || "tuan",
      periodValue: periodValue !== void 0 ? periodValue : dbData.config.currentWeek || 4,
      periodLabel: periodLabel || `Tu\u1EA7n ${dbData.config.currentWeek || 4}`,
      content: content.trim(),
      category: category || "Chung",
      rating: rating || "T\u1ED1t",
      authorId: authorId || "acc_admin",
      authorName: authorName || "C\xF4 Thu Th\u1EE7y (GVCN)",
      authorRole: authorRole || "admin",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!dbData.evaluations) dbData.evaluations = [];
    dbData.evaluations.unshift(newEval);
    saveDatabase(dbData);
    addAuditLog(authorId || "acc_admin", authorName || "C\xE1n b\u1ED9", authorRole || "admin", "Nh\u1EADn x\xE9t h\u1ECDc sinh", `\u0110\xE3 th\xEAm nh\u1EADn x\xE9t cho HS ${student.name} (${newEval.periodLabel})`);
    res.json({ success: true, evaluation: newEval });
  });
  app.put("/api/evaluations/:id", (req, res) => {
    const { id } = req.params;
    if (!dbData.evaluations) dbData.evaluations = [];
    const evalItem = dbData.evaluations.find((e) => e.id === id);
    if (!evalItem) return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y nh\u1EADn x\xE9t." });
    const { content, category, rating, periodType, periodValue, periodLabel } = req.body;
    if (content) evalItem.content = content.trim();
    if (category) evalItem.category = category;
    if (rating) evalItem.rating = rating;
    if (periodType) evalItem.periodType = periodType;
    if (periodValue !== void 0) evalItem.periodValue = periodValue;
    if (periodLabel) evalItem.periodLabel = periodLabel;
    evalItem.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveDatabase(dbData);
    res.json({ success: true, evaluation: evalItem });
  });
  app.delete("/api/evaluations/:id", (req, res) => {
    const { id } = req.params;
    const { adminName } = req.body;
    if (!dbData.evaluations) dbData.evaluations = [];
    const idx = dbData.evaluations.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const deleted = dbData.evaluations.splice(idx, 1)[0];
      saveDatabase(dbData);
      addAuditLog("admin", adminName || "GVCN", "admin", "X\xF3a nh\u1EADn x\xE9t", `\u0110\xE3 x\xF3a nh\u1EADn x\xE9t c\u1EE7a HS ${deleted.studentName}`);
    }
    res.json({ success: true });
  });
  app.post("/api/reset-demo", (req, res) => {
    const { adminName } = req.body;
    dbData = JSON.parse(JSON.stringify(INITIAL_APP_DATA));
    saveDatabase(dbData);
    addAuditLog("admin", adminName || "GVCN", "admin", "Kh\xF4i ph\u1EE5c M\u1EB7c \u0111\u1ECBnh", "\u0110\xE3 kh\xF4i ph\u1EE5c to\xE0n b\u1ED9 h\u1EC7 th\u1ED1ng v\u1EC1 danh s\xE1ch L\u1EDBp 9A1 - THCS V\xE2n H\xE0 2");
    res.json({ success: true, message: "Kh\xF4i ph\u1EE5c d\u1EEF li\u1EC7u ban \u0111\u1EA7u th\xE0nh c\xF4ng." });
  });
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
