import React from 'react';
import PropTypes from 'prop-types';
import loggerFactory from '@alias/logger';
import { withTranslation } from 'react-i18next';

import LoginContainer from '../services/LoginContainer';
import { createSubscribedElement } from './UnstatedUtils';

const logger = loggerFactory('growi:loginForm');

class LoginForm extends React.Component {

  constructor(props) {
    super(props);

    this.switchForm = this.switchForm.bind(this);
    this.handleLoginWithExternalAuth = this.handleLoginWithExternalAuth.bind(this);
    this.renderLocalOrLdapLoginForm = this.renderLocalOrLdapLoginForm.bind(this);
    this.renderExternalAuthLoginForm = this.renderExternalAuthLoginForm.bind(this);
    this.renderExternalAuthInput = this.renderExternalAuthInput.bind(this);
    this.renderRegisterForm = this.renderRegisterForm.bind(this);
  }

  async componentDidMount() {
    const { loginContainer } = this.props;

    try {
      await loginContainer.retrieveData();
    }
    catch (err) {
      loginContainer.setState({ retrieveError: err.message });
      logger.error(err);
    }
  }

  // for flip [TODO][GW-1865] use state or react component for flip
  switchForm(e) {
    if (e.target.id === 'register') {
      $('#login-dialog').addClass('to-flip');
    }
    else {
      $('#login-dialog').removeClass('to-flip');
    }
  }

  handleLoginWithExternalAuth(e) {
    this.props.loginContainer.loginWithExternalAuth(e.currentTarget.id);
  }

  renderLocalOrLdapLoginForm() {
    const { t, csrf } = this.props;

    return (
      <form role="form" action="/login" method="post">
        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <span className="input-group-text">
              <i className="icon-user"></i>
            </span>
          </div>
          <input type="text" className="form-control" placeholder="Username or E-mail" name="loginForm[username]" />
          {this.isLdapStrategySetup && (
            <div className="input-group-append">
              <small className="input-group-text text-success">
                <i className="icon-fw icon-check"></i> LDAP
              </small>
            </div>
          )}
        </div>

        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <span className="input-group-text">
              <i className="icon-lock"></i>
            </span>
          </div>
          <input type="password" className="form-control" placeholder="Password" name="loginForm[password]" />
        </div>

        <div className="input-group justify-content-center d-flex mt-5">
          {/* [TODO][GW-1913] An AppContainer gets csrf data */}
          <input type="hidden" name="_csrf" value={csrf} />
          <button type="submit" id="login" className="btn btn-fill login px-0 py-2">
            <div className="eff"></div>
            <span className="btn-label p-3">
              <i className="icon-login"></i>
            </span>
            <span className="btn-label-text p-3">{t('Sign in')}</span>
          </button>
        </div>
      </form>
    );
  }

  renderExternalAuthInput(auth) {
    const { t } = this.props;
    return (
      <div key={auth} className="input-group justify-content-center d-flex mt-5">
        <button type="button" className="btn btn-fill px-0 py-2" id={auth} onClick={this.handleLoginWithExternalAuth}>
          <div className="eff"></div>
          <span className="btn-label p-3">
            <i className={`fa fa-${auth}`}></i>
          </span>
          <span className="btn-label-text p-3">{t('Sign in')}</span>
        </button>
        <div className="small text-center">by {auth} Account</div>
      </div>
    );
  }

  renderExternalAuthLoginForm() {
    const { loginContainer } = this.props;
    const isExternalAuthCollapsible = loginContainer.state.isLocalStrategySetup || loginContainer.state.isLdapStrategySetup;
    const collapsibleClass = isExternalAuthCollapsible ? 'collapse collapse-external-auth collapse-anchor' : '';

    return (
      <>
        <div className="border-bottom"></div>
        <div id="external-auth" className={`external-auth ${collapsibleClass}`}>
          <div className="spacer"></div>
          <div className="d-flex flex-row justify-content-between flex-wrap">
            {Object.keys(loginContainer.state.objOfIsExternalAuthEnableds).map((auth) => {
              if (!loginContainer.state.objOfIsExternalAuthEnableds[auth]) {
                return;
              }
              return this.renderExternalAuthInput(auth);
            })}
          </div>
          <div className="spacer"></div>
        </div>
        <div className="border-bottom"></div>
        <div className="text-center">
          <button
            type="button"
            className="collapse-anchor btn btn-xs btn-collapse-external-auth mb-3"
            data-toggle={isExternalAuthCollapsible ? 'collapse' : ''}
            data-target="#external-auth"
            aria-expanded="false"
            aria-controls="external-auth"
          >
            External Auth
          </button>
        </div>
      </>
    );
  }

  renderRegisterForm() {
    const { t, loginContainer, csrf } = this.props;
    return (
      <div className="back">
        {this.registrationMode === 'Restricted' && (
          <p className="alert alert-warning">
            {t('page_register.notice.restricted')}
            <br />
            {t('page_register.notice.restricted_defail')}
          </p>
        )}
        <form role="form" action="/register" method="post" id="register-form">
          <div className="input-group" id="input-group-username">
            <div className="input-group-prepend">
              <span className="input-group-text">
                <i className="icon-user"></i>
              </span>
            </div>
            <input type="text" className="form-control" placeholder={t('User ID')} name="registerForm[username]" defaultValue={this.props.username} required />
          </div>
          <p className="form-text text-danger">
            <span id="help-block-username"></span>
          </p>

          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">
                <i className="icon-tag"></i>
              </span>
            </div>
            <input type="text" className="form-control" placeholder={t('Name')} name="registerForm[name]" defaultValue={this.props.name} required />
          </div>

          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">
                <i className="icon-envelope"></i>
              </span>
            </div>
            <input type="email" className="form-control" placeholder={t('Email')} name="registerForm[email]" defaultValue={this.props.email} required />
          </div>

          {loginContainer.state.registrationWhiteList.length > 0 && (
            <>
              <p className="form-text">{t('page_register.form_help.email')}</p>
              <ul>
                {loginContainer.state.registrationWhiteList.map((elem) => {
                  return (
                    <li key={elem}>
                      <code>{elem}</code>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">
                <i className="icon-lock"></i>
              </span>
            </div>
            <input type="password" className="form-control" placeholder={t('Password')} name="registerForm[password]" required />
          </div>

          <div className="input-group justify-content-center mt-5">
            {/* [TODO][GW-1913] An AppContainer gets csrf data */}
            <input type="hidden" name="_csrf" value={csrf} />
            <button type="submit" className="btn btn-fill px-0 py-2" id="register">
              <div className="eff"></div>
              <span className="btn-label p-3">
                <i className="icon-user-follow"></i>
              </span>
              <span className="btn-label-text p-3">{t('Sign up')}</span>
            </button>
          </div>
        </form>

        <div className="border-bottom mb-3"></div>

        <div className="row">
          <div className="text-right col-12 py-1">
            <a href="#login" id="login" className="link-switch" onClick={this.handleClick}>
              <i className="icon-fw icon-login"></i>
              {t('Sign in is here')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { t, loginContainer, isRegistering } = this.props;

    const isLocalOrLdapStrategiesEnabled = loginContainer.state.isLocalStrategySetup || loginContainer.state.isLdapStrategySetup;
    const registerFormClass = isRegistering ? 'to-flip' : '';
    const isSomeExternalAuthEnabled = Object.values(loginContainer.state.objOfIsExternalAuthEnableds).some(elem => elem);

    return (
      <div className={`login-dialog mx-auto flipper ${registerFormClass}`} id="login-dialog">
        <div className="row mx-0">
          <div className="col-12">
            <div className="front">
              {isLocalOrLdapStrategiesEnabled && this.renderLocalOrLdapLoginForm()}
              {isSomeExternalAuthEnabled && this.renderExternalAuthLoginForm()}
              {loginContainer.state.isRegistrationEnabled && (
                <div className="row">
                  <div className="col-12 text-right py-2">
                    <a href="#register" id="register" className="link-switch" onClick={this.switchForm}>
                      <i className="ti-check-box"></i> {t('Sign up is here')}
                    </a>
                  </div>
                </div>
              )}
            </div>
            {loginContainer.state.isRegistrationEnabled && this.renderRegisterForm()}
            <a href="https://growi.org" className="link-growi-org pl-3">
              <span className="growi">GROWI</span>.<span className="org">ORG</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const LoginFormWrapper = (props) => {
  return createSubscribedElement(LoginForm, props, [LoginContainer]);
};

LoginForm.propTypes = {
  // i18next
  t: PropTypes.func.isRequired,
  loginContainer: PropTypes.instanceOf(LoginContainer).isRequired,
  isRegistering: PropTypes.bool,
  username: PropTypes.string,
  name: PropTypes.string,
  email: PropTypes.string,
  csrf: PropTypes.string,
};

export default withTranslation()(LoginFormWrapper);
