import express from "express";

const digits = "1234567890";
function rand(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function generateOTP(length = 6) {
  let otp = "";
  while (otp.length < length) {
    const charIndex = rand(0, digits.length);
    otp += digits[charIndex];
  }
  return otp;
}

export default generateOTP;
