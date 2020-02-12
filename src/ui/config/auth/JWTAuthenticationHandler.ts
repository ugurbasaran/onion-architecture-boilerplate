import { inject, injectable } from 'inversify';

import { getStatusText, UNAUTHORIZED } from 'http-status-codes';

import {
  UI_APPLICATION_IDENTIFIERS,
  UI_IDENTIFIERS,
  UI_MAPPINGS_IDENTIFIERS,
} from 'ui/UiModuleSymbols';
import { JWTTokenUtil } from 'ui/config/auth/utils/JWTTokenUtil';
import { IAuthenticationHandler } from 'ui/config/auth/IAuthenticationHandler';
import { APP_TOKEN_LIFE, APP_TOKEN_SECRET } from 'ui/config/consts/variables';
import { UIMapper } from 'ui/common/mappings/UIMapper';

import { AuthenticationRequest } from 'core/applicationServices/Authentication/requests/AuthenticationRequest';
import { Authentication } from 'ui/config/auth/models/Authentication';

import { IAuthenticationService } from 'core/applicationServices/Authentication/IAuthenticationService';

import {
  DOMAIN_APPLICATION_SERVICE_IDENTIFIERS,
  DOMAIN_MAPPING_IDENTIFIERS,
} from 'core/CoreModuleSymbols';

import { User } from 'core/domain/User/User';
import { User as UserUI } from 'ui/common/models/User';
import { UserInterfaceError } from 'ui/config/errors/UserInterfaceError';

@injectable()
export class JWTAuthenticationHandler implements IAuthenticationHandler {
  constructor(
    @inject(UI_APPLICATION_IDENTIFIERS.JWT_TOKEN_UTIL)
    private readonly jwtTokenUtil: JWTTokenUtil,
    @inject(DOMAIN_APPLICATION_SERVICE_IDENTIFIERS.AUTHENTICATION_SERVICE)
    private readonly authenticationService: IAuthenticationService,
    @inject(UI_IDENTIFIERS.UI_MAPPER)
    private readonly uiMapper: UIMapper
  ) {}

  async authenticate(request: AuthenticationRequest) {
    const user = await this.authenticationService.verifyCredentials(request);

    if (!user) {
      throw new UserInterfaceError(
        UNAUTHORIZED,
        getStatusText(UNAUTHORIZED).toUpperCase()
      );
    }

    const userUi = this.uiMapper.mapper.map<User, UserUI>(
      {
        destination: UI_MAPPINGS_IDENTIFIERS.USER_UI,
        source: DOMAIN_MAPPING_IDENTIFIERS.USER_DOMAIN,
      },
      user
    );

    return new Authentication(
      this.jwtTokenUtil.generateToken(
        userUi,
        'user',
        APP_TOKEN_SECRET,
        APP_TOKEN_LIFE
      )
    );
  }
}
