import api from "./client";

export const createFacilityRequest = (data) =>
  api.post("/requests/facility", data);

export const getFacilityRequests = () =>
  api.get("/requests/facility");

export const updateFacilityRequestStatus = (id, status) =>
  api.put(`/requests/facility/${id}/status`, { status });
