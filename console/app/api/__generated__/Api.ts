/* eslint-disable */

    import type { FetchParams, FullParams, ApiResult } from "./http-client";
    import { dateReplacer, handleResponse, mergeParams, toQueryString } from './http-client'
    import { snakeify } from './util'

    export type { ApiResult, ErrorBody, ErrorResult } from './http-client'
    
export type DailyMileageRow =
{
/** Date in YYYY-MM-DD format. */
"day": string,"miles": number,};

export type FromDateMileageResponse =
{"miles": number,};

export type HealthResponse =
{"status": string,};

export type WeeklyMileageRow =
{"miles": number,
/** Week start date (Monday) in YYYY-MM-DD format. */
"week": string,};

export interface MileageFromDateQueryParams {
  date: string,
}

type EmptyObj = Record<string, never>;
export interface ApiConfig {
      /**
       * No host means requests will be sent to the current host. This is used in
       * the web console.
       */
      host?: string;
      token?: string;
      baseParams?: FetchParams;
    }

    export class Api {
      host: string;
      token?: string;
      baseParams: FetchParams;
      /**
       * Pulled from info.version in the OpenAPI schema. Sent in the
       * `api-version` header on all requests.
       */
      apiVersion = "0.1.0";

      constructor({ host = "", baseParams = {}, token }: ApiConfig = {}) {
        this.host = host;
        this.token = token;

        const headers = new Headers({
          "Content-Type": "application/json",
          "api-version": this.apiVersion,
        });

        if (token) headers.append("Authorization", `Bearer ${token}`);

        this.baseParams = mergeParams({ headers }, baseParams);
      }

      public async request<Data>({
        body,
        path,
        query,
        host,
        ...fetchParams
      }: FullParams): Promise<ApiResult<Data>> {
        const url = (host || this.host) + path + toQueryString(query);
        const init = {
          ...mergeParams(this.baseParams, fetchParams),
          body: JSON.stringify(snakeify(body), dateReplacer),
        };
        return handleResponse(await fetch(url, init));
      }
       
      methods = {
/**
* Health check endpoint.
 */
healthCheck: (_: EmptyObj,
params: FetchParams = {}) => {
         return this.request<HealthResponse>({
           path: `/health`,
           method: "GET",
  ...params,
         })
      },
/**
* Returns total walking/running distance grouped by day, newest first.
 */
dailyMileage: (_: EmptyObj,
params: FetchParams = {}) => {
         return this.request<DailyMileageRow[]>({
           path: `/mileage/daily`,
           method: "GET",
  ...params,
         })
      },
/**
* Returns total walking/running distance from a given date to now.
 */
mileageFromDate: ({ 
query, }: {query: MileageFromDateQueryParams,
},
params: FetchParams = {}) => {
         return this.request<FromDateMileageResponse>({
           path: `/mileage/from-date`,
           method: "GET",
  query,
  ...params,
         })
      },
/**
* Returns total walking/running distance grouped by week (Monday start), newest first.
 */
weeklyMileage: (_: EmptyObj,
params: FetchParams = {}) => {
         return this.request<WeeklyMileageRow[]>({
           path: `/mileage/weekly`,
           method: "GET",
  ...params,
         })
      },
}
     ws = {
  }
     }

   export default Api;
