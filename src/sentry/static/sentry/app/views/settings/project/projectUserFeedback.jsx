import PropTypes from 'prop-types';
import React from 'react';
import styled from 'react-emotion';

import sdk from 'app/utils/sdk';
import {t} from 'app/locale';
import AsyncView from 'app/views/asyncView';
import Button from 'app/components/button';
import Form from 'app/views/settings/components/forms/form';
import JsonForm from 'app/views/settings/components/forms/jsonForm';
import {Panel, PanelBody, PanelHeader} from 'app/components/panels';
import SettingsPageHeader from 'app/views/settings/components/settingsPageHeader';
import TextBlock from 'app/views/settings/components/text/textBlock';
import formGroups from 'app/data/forms/userFeedback';

const CodeBlock = styled.pre`
  word-break: break-all;
  white-space: pre-wrap;
`;

const TextBlockNoMargin = styled(TextBlock)`
  margin-bottom: 0;
`;

class ProjectUserFeedbackSettings extends AsyncView {
  static propTypes = {
    setProjectNavSection: PropTypes.func,
  };

  componentWillMount() {
    super.componentWillMount();
    this.props.setProjectNavSection('settings');
  }

  componentDidMount() {
    window.sentryEmbedCallback = function(embed) {
      // Mock the embed's submit xhr to always be successful
      // NOTE: this will not have errors if the form is empty
      embed.submit = function(body) {
        this._submitInProgress = true;
        setTimeout(
          function() {
            this._submitInProgress = false;
            this.onSuccess();
          }.bind(this),
          500
        );
      };
    };
  }

  componentWillUnmount() {
    window.sentryEmbedCallback = null;
  }

  getEndpoints() {
    let {orgId, projectId} = this.props.params;
    return [
      ['keyList', `/projects/${orgId}/${projectId}/keys/`],
      ['project', `/projects/${orgId}/${projectId}/`],
    ];
  }

  getInstructions() {
    let dsn = this.state.keyList.length
      ? this.state.keyList[0].dsn.public
      : 'https://public@sentry.example.com/1';

    return (
      '<!-- Sentry JS SDK 2.1.+ required -->\n' +
      '<script src="https://cdn.ravenjs.com/3.23.1/raven.min.js"></script>\n\n' +
      '{% if request.sentry.id %}\n' +
      '  <script>\n' +
      '  Raven.showReportDialog({\n' +
      '    // grab the eventId generated by the Sentry SDK\n' +
      "    eventId: '{{ request.sentry.id }}',\n\n" +
      '    // use the public DSN (dont include your secret!)\n' +
      "    dsn: '" +
      dsn +
      "'\n" +
      '  });\n' +
      '  </script>\n' +
      '{% endif %}\n'
    );
  }

  getBrowserJSInstructions() {
    let dsn = this.state.keyList.length
      ? this.state.keyList[0].dsn.public
      : 'https://public@sentry.example.com/1';

    return (
      '<!-- Sentry JS SDK 2.1.+ required -->\n' +
      '<script src="https://cdn.ravenjs.com/2.1.0/raven.min.js"></script>\n\n' +
      '<script>\n' +
      '// configure the SDK as you normally would\n' +
      "Raven.config('" +
      dsn +
      "').install();\n\n" +
      '/**\n' +
      ' * Report a routing error to Sentry and show a feedback dialog to\n' +
      ' * the user.\n' +
      ' * \n' +
      ' * > try {\n' +
      ' * >   renderRoute()\n' +
      ' * > } catch (err) {\n' +
      ' * >   handleRouteError(err);\n' +
      ' * > }\n' +
      ' */\n' +
      'function handleRouteError(err) {\n' +
      '  Raven.captureException(err);\n' +
      '  Raven.showReportDialog();\n' +
      '};\n' +
      '</script>\n'
    );
  }

  handleClick = () => {
    sdk.showReportDialog({
      // should never make it to the Sentry API, but just in case, use throwaway id
      eventId: '00000000000000000000000000000000',
    });
  };

  renderBody() {
    let {orgId, projectId} = this.props.params;

    return (
      <div>
        <SettingsPageHeader title={t('User Feedback')} />
        <TextBlock>
          {t(
            'Enabling User Feedback allows you to interact with your users on an unprecedented level. Collect additional details about issues affecting them, and more importantly reach out to them with resolutions.'
          )}
        </TextBlock>
        <TextBlock>
          {t(
            'When configured, your users will be presented with a dialog prompting them for additional information. That information will get attached to the issue in Sentry'
          )}
        </TextBlock>

        <TextBlock>
          <Button priority="primary" onClick={this.handleClick}>
            {t('See the report dialog in action')}
          </Button>
        </TextBlock>

        <Panel>
          <PanelHeader>{t('Integration')}</PanelHeader>

          <PanelBody disablePadding={false}>
            <TextBlockNoMargin>
              {t(
                "The following example uses our Django integration. Check the documentation for the SDK you're using for more details."
              )}
            </TextBlockNoMargin>
            <CodeBlock>{this.getInstructions()}</CodeBlock>

            <TextBlockNoMargin css={{marginTop: 30}}>
              {t(
                "If you're capturing an error with our Browser JS SDK, things get even simpler"
              )}
            </TextBlockNoMargin>
            <CodeBlock>{this.getBrowserJSInstructions()}</CodeBlock>
          </PanelBody>
        </Panel>

        <Form
          saveOnBlur
          apiMethod="PUT"
          apiEndpoint={`/projects/${orgId}/${projectId}/`}
          initialData={this.state.project.options}
        >
          <JsonForm forms={formGroups} />
        </Form>
      </div>
    );
  }
}

export default ProjectUserFeedbackSettings;
