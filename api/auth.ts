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
    userType: "new" | "old";
  };
};

export type VerifyOtpError = {
  success: boolean;
  message: string;
  description: string;
};

export function requestOtp(email: string) {
  return apiRequest<RequestOtpResponse>("/auth/request-otp", {
    method: "POST",
    body: { email },
  });
}

export function verifyOtp(email: string, otp: string) {
  return apiRequest<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });
}
