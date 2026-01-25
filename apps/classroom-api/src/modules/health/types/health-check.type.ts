export type StatusHealthCheckResponse = {
  [key: string]: Status;
};

export type Status = {
  status: string;
  message?: string;
};
