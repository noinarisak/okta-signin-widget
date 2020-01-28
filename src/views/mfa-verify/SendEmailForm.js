/*!
 * Copyright (c) 2015-2019, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

define(['okta', 'util/Enums'], function (Okta, Enums) {

  var _ = Okta._;

  const SendEmailCodeForm = Okta.Form.extend({
    className: 'send-email-form',
    //title: _.partial(Okta.loc, 'enroll.email.title', 'login'),
    title: 'Verify with Email Authentication',
    noButtonBar: false,
    autoSave: true,
    noCancelButton: true,
    save: _.partial(Okta.loc, 'enroll.email.save', 'login'),

    initialize: function () {
      Okta.Form.prototype.initialize.apply(this, arguments);
    },
  });

  const VerifyEmailCodeForm = Okta.Form.extend({
    className: 'verify-email-form',
    //title: _.partial(Okta.loc, 'enroll.email.title', 'login'),
    title: 'Verify with Email Authentication',
    noButtonBar: false,
    autoSave: true,
    noCancelButton: true,
    //save: _.partial(Okta.loc, 'oform.verify', 'login'),
    save() {
      return this.emailRequired ? 'send code' : 'verify';
    },

    events: Object.assign({}, Okta.Form.prototype.events, {
      submit: function (e) {
        e.preventDefault();
        this.clearErrors();

        if (this.emailRequired) {
          this.model.set('answer', '');
          this.model.save()
            .then(() => {
              this.model.trigger('emailSent');
              this.emailRequired = false;
              this.removeChildren();
              this.render();
            });
        } else {
          if (this.isValid()) {
            this.model.save();
          }
        }
      }
    }),

    emailRequired: true,

    postRender: function () {
      Okta.Form.prototype.postRender.apply(this, arguments);

      if (this.emailRequired) {
        this.add(Okta.View.extend({
          attributes: {
            'data-se': 'enroll-email-content'
          },
          template: 'Send verification code to {{{emailFragment}}}',
          getTemplateData() {
            const emailTpl = Okta.tpl('<span class="email-mask">{{email}}</span>');
            const email = this.model.get('email');
            return {emailFragment: emailTpl({email})};
          },
        }));
      } else {
        this.add(Okta.View.extend({
          className: 'enroll-activate-email-content',
          attributes: {
            'data-se': 'enroll-activate-email-content',
          },

          // Why use `{{{` for the description?
          // - factorEmail is actually an HTML fragment which
          //   is created via another handlebar template and used for bold the email address.
          template: '{{{i18n code="enroll.activate.email.description" bundle="login" arguments="factorEmail"}}}',

          getTemplateData: function () {
            const factor = this.options.appState.get('factor');
            const factorEmailVal = factor && factor.profile ? factor.profile.email : '';
            const factorEmail = Okta.tpl('<span class="mask-email">{{email}}</span>')({email: factorEmailVal });
            return {
              factorEmail,
            };
          },
        }));
        this.add(Okta.View.extend({
          className: 'hide resend-email-infobox',
          template: '<div class="infobox infobox-warning">' +
            '<span class="icon warning-16"></span>' +
            '<p>' +
            '<span>{{i18n code="enroll.activate.email.not.received" bundle="login"}}</span>'+
            '<a href="#" class="email-activate-send-again-btn">' +
            '{{i18n code="enroll.activate.email.resend" bundle="login"}}'+
            '</a>' +
            '</p>' +
            '</div>',

          events: {
            'click .email-activate-send-again-btn': 'resendEmail',
          },

          postRender: function () {
            this.showResendCallout();
          },

          showResendCallout: function () {
            _.delay(() => {
              this.$el.removeClass('hide');
            }, Enums.API_RATE_LIMIT);
          },

          hideResendCallout: function () {
            this.$el.addClass('hide');
          },

          resendEmail: function (e) {
            e.preventDefault();
            this.hideResendCallout();
            this.model.resend()
              .finally(this.showResendCallout.bind(this));
          },
        }));

        this.addInput({
          label: Okta.loc('enroll.activate.email.code.label', 'login'),
          'label-top': true,
          name: 'answer',
          type: 'text',
          wide: true,
        });
      }

      // this.add(Okta.createButton({
      //   title: 'send code to email',
      //   click() {
      //     console.log('send email');
      //   }
      // }));

    },
  });

  return VerifyEmailCodeForm;

});
