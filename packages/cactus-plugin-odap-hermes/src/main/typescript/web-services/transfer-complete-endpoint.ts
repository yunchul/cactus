import { Express, Request, Response } from "express";

import {
  IWebServiceEndpoint,
  IExpressRequestHandler,
  IEndpointAuthzOptions,
} from "@hyperledger/cactus-core-api";
import {
  Logger,
  Checks,
  LogLevelDesc,
  LoggerProvider,
  IAsyncProvider,
} from "@hyperledger/cactus-common";

import { registerWebServiceEndpoint } from "@hyperledger/cactus-core";

import { PluginOdapGateway } from "../gateway/plugin-odap-gateway";
import { TransferCompleteV1Request } from "../generated/openapi/typescript-axios";
import OAS from "../../json/openapi.json";

export interface ITransferCompleteEndpointOptions {
  logLevel?: LogLevelDesc;
  gateway: PluginOdapGateway;
}

export class TransferCompleteEndpointV1 implements IWebServiceEndpoint {
  public static readonly CLASS_NAME = "TransferCompleteEndpointV1";

  private readonly log: Logger;

  public get className(): string {
    return TransferCompleteEndpointV1.CLASS_NAME;
  }

  constructor(public readonly options: ITransferCompleteEndpointOptions) {
    const fnTag = `${this.className}#constructor()`;
    Checks.truthy(options, `${fnTag} arg options`);
    Checks.truthy(options.gateway, `${fnTag} arg options.connector`);

    const level = this.options.logLevel || "INFO";
    const label = this.className;
    this.log = LoggerProvider.getOrCreate({ level, label });
  }

  public getPath(): string {
    const apiPath =
      OAS.paths[
        "/api/v1/@hyperledger/cactus-plugin-odap-hemres/phase3/transfercomplete"
      ];
    return apiPath.get["x-hyperledger-cactus"].http.path;
  }

  public getVerbLowerCase(): string {
    const apiPath =
      OAS.paths[
        "/api/v1/@hyperledger/cactus-plugin-odap-hemres/phase3/transfercomplete"
      ];
    return apiPath.get["x-hyperledger-cactus"].http.verbLowerCase;
  }

  public getOperationId(): string {
    return OAS.paths[
      "/api/v1/@hyperledger/cactus-plugin-odap-hemres/phase3/transfercomplete"
    ].get.operationId;
  }

  getAuthorizationOptionsProvider(): IAsyncProvider<IEndpointAuthzOptions> {
    // TODO: make this an injectable dependency in the constructor
    return {
      get: async () => ({
        isProtected: true,
        requiredRoles: [],
      }),
    };
  }

  public async registerExpress(
    expressApp: Express,
  ): Promise<IWebServiceEndpoint> {
    await registerWebServiceEndpoint(expressApp, this);
    return this;
  }

  public getExpressRequestHandler(): IExpressRequestHandler {
    return this.handleRequest.bind(this);
  }

  public async handleRequest(req: Request, res: Response): Promise<void> {
    const reqTag = `${this.getVerbLowerCase()} - ${this.getPath()}`;
    this.log.debug(reqTag);
    const reqBody: TransferCompleteV1Request = req.body;
    try {
      const resBody = await this.options.gateway.transferCompleteReceived(
        reqBody,
      );
      res.json(resBody);
    } catch (ex) {
      this.log.error(`Crash while serving ${reqTag}`, ex);
      res.status(500).json({
        message: "Internal Server Error",
        error: ex?.stack || ex?.message,
      });
    }
  }
}