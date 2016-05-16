const CM = require('codemirror');
import 'codemirror/addon/runmode/runmode';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'demo/assets/styles/codemirror.css';

const React = require('react');
const ReactDOM = require('react-dom');
const classNames = require('classnames');
const trim = require('lodash.trim');

const SLDSBreadCrumb = require('../components/bread-crumb');
const SLDSButton = require('../components/button');
const SLDSButtonGroup = require('../components/button-group');
const SLDSButtonIcon = require('../components/icon/button-icon');
const SLDSButtonStateful = require('../components/button-stateful');
const SLDSCard =  require('../components/card');
const SLDSCardEmpty = require('../components/card/empty');
const SLDSCardFilter = require('../components/card/filter');
const SLDSDataTable = require('../components/data-table');
const SLDSDataTableCell = require('../components/data-table/cell');
const SLDSDataTableColumn = require('../components/data-table/column');
const SLDSDataTableRowActions = require('../components/data-table/row-actions');
const SLDSDatepicker = require('../components/date-picker');
const SLDSIcon = require('../components/icon');
const SLDSLookup = require('../components/lookup');
const SLDSMenuDropdown = require('../components/menu-dropdown');
const SLDSMenuPicklist = require('../components/menu-picklist');
const SLDSModal = require('../components/modal');
const SLDSNotification = require('../components/notification');
const SLDSPageHeader = require('../components/page-header');
const SLDSPopoverTooltip = require('../components/popover-tooltip');
const SLDSTimepicker = require('../components/time-picker');

const displayName = 'CodeMirror';
const propTypes = {
  className: React.PropTypes.string,
  onChange: React.PropTypes.func,
  onFocusChange: React.PropTypes.func,
  options: React.PropTypes.object,
  path: React.PropTypes.string,
  value: React.PropTypes.string,
};
const defaultProps = {};

const isMarkup = (code) => {
  return code && trim(code).indexOf('<')===0;
};

function request (url, method, data, callback) {
  const request = new window.XMLHttpRequest()
  request.onreadystatechange = () => {
    if (request.readyState === 4) {
      const res = JSON.parse(request.responseText)
      if (request.status === 200) {
        if (res.response) {
          return callback(null, res.response)
        }
        if (res.error) {
          return callback(new Error(res.error))
        }
      } else {
        return callback(new Error('REQUEST_ERROR'))
      }
    }
  }
  request.open(method, url)
  request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
  request.send(JSON.stringify(data))
}

class CodeMirrorEditor extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this.refs.editor);
    this.editor = CM.fromTextArea(node, {
      mode: isMarkup(this.props.codeText)?'htmlmixed':'javascript',
      lineNumbers: true,
      lineWrapping: false,
      matchBrackets: true,
      tabSize: 2,
      readOnly: this.props.readOnly
    });
    this.editor.on('change', this.handleChange);
  }

  componentDidUpdate() {
    if (this.props.readOnly) {
      this.editor.setValue(this.props.codeText);
    }
  }

  handleChange() {
    if (!this.props.readOnly && this.props.onChange) {
      this.props.onChange(this.editor.getValue());
    }
  }

  render() {
    let editor = <textarea ref="editor" defaultValue={this.props.codeText} />;
    return (
      <div style={this.props.style} className={this.props.className}>
        {editor}
      </div>
      );
  }
}

class CodeMirror extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      code: props.codeText,
      showCode: false,
    };
  }

  componentDidMount() {
    this.executeCode();
  }

  handleCodeChange(code) {
    clearTimeout(this._codeTimeout);
    this._codeTimeout = setTimeout(() => {
      this.setState({ code }, this.executeCode);
    }, 300)
  }

  clearExample() {
    const mountNode = ReactDOM.findDOMNode(this.refs.mount);
    try {
      ReactDOM.unmountComponentAtNode(mountNode);
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
    }
    return mountNode;
  }

  isMarkup(){
    return this.state.code && trim(this.state.code).indexOf('<')===0;
  }

  getCode() {
    if(!isMarkup(this.state.code)){
      return this.state.code;
    }
    return "\
    class Example extends React.Component {\
      render(){\
        return (<section>"+this.state.code+"</section>);\
      }\
    }\
    ReactDOM.render(<Example />, mountNode);";
  }

  executeCode() {
    request('/api/transform/js', 'POST', {
      js: this.getCode()
    }, (err, result) => {
      const mountNode = this.clearExample();
      if (err) {
        // TODO: Display error message
        clearTimeout(this.errorTimeout);
        this.errorTimeout = setTimeout(() => {
          ReactDOM.render(
            <div bsStyle="danger">
            {err.toString()}
            </div>,
            mountNode
          );
        }, 500);
        return;
      }
      /* eslint-disable */
      eval(result);
      /* eslint-enable */
    })
  }


  renderEditor() {
    if (!this.state.showCode) {
      return null;
    }

    return (
        <CodeMirrorEditor
          key="jsx"
          onChange={this.handleCodeChange.bind(this)}
          className="highlight bb-gray bh-gray"
          codeText={this.state.code}
        />
    );
  }

  renderExample() {
    return (
      <div className={classNames('bs-example', this.props.exampleClassName)}>
        <div ref="mount" />
      </div>
    );
  }

  toggleEditor() {
    this.setState({ showCode: !this.state.showCode })
  }

  render() {
    return (
      <div className="playground">
        <div className="slds-p-vertical--medium">
            {this.renderExample()}
        </div>
        <div className="demo-only bb-gray slds-text-align--right slds-p-bottom--x-small">
          <button onClick={this.toggleEditor.bind(this)}>
            <SLDSButtonIcon name={this.state.showCode ? "chevronup" : "chevrondown"} position="left" />
            <span>
              {this.state.showCode ? "Hide Code" : "Show Code"}
            </span>
          </button>
        </div>

        {this.renderEditor()}
      </div>
    );
  }
}

CodeMirror.displayName = displayName;
CodeMirror.propTypes = propTypes;
CodeMirror.defaultProps = defaultProps;

module.exports = CodeMirror;
