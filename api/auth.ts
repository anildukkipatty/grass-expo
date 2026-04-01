import { apiRequest } from "./client";

export type RequestOtpResponse = {
  success: boolean;
  message: string;
  isNewUser: boolean;
};

export type RequestOtpError = {
  success: boolean;
  message: string;
  description: string;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
  };
};

export type VerifyOtpError = {
  success: boolean;
  message: string;
  description: string;
};

export function requestOtp(email: string) {
  return apiRequest<RequestOtpResponse>("/api/auth/request-otp", {
    method: "POST",
    body: { email },
  });
}

export function verifyOtp(email: string, otp: string) {
  return apiRequest<VerifyOtpResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });
}
