/** @jsx React.DOM */

var AnswerTableRowComponent = React.createClass({
  render: function() {
    var correctClass = this.props.choice == this.props.correct ? "correct" : "incorrect";
    return (
      <tr className={correctClass}>
        <td>{this.props.title}</td>
        <td><img src={this.props.choice} /></td>
        <td><img src={this.props.correct} /></td>
      </tr>
    );
  }
});

var AnswersTableComponent = React.createClass({
  render: function() {
    var answerRows = _.map(this.props.answers, function(answer) {
      return (
        <AnswerTableRowComponent key={answer.title} title={answer.title} choice={answer.choice} correct={answer.correct} />
      );
    });

    return (
      <table className="answers-table">
        <tr>
          <th>Item</th>
          <th>Chosen answer</th>
          <th>Correct answer</th>
        </tr>
        {answerRows}
      </table>
    );
  }
});

var ApplicantTableRowComponent = React.createClass({
  render: function() {
    return (
      <tr className="applicant-row" onClick={this.showAnswers}>
        <td>{this.props.id}</td>
        <td>{this.props.numQuestions}</td>
        <td>{this.props.numAnswered}</td>
        <td>{this.props.numCorrect}</td>
      </tr>
    );
  },
  showAnswers: function() {
    this.props.showAnswers(this.props.id)
  }
});

var ApplicantTableComponent = React.createClass({
  render: function() {
    var self = this;

    var applicantRows = _.map(this.props.applicants, function(applicant) {
      return <ApplicantTableRowComponent
                key={applicant.id}
                id={applicant.id}
                numQuestions={applicant.numQuestions}
                numAnswered={applicant.numAnswered}
                numCorrect={applicant.numCorrect}
                showAnswers={self.props.showAnswers} />
    });

    return (
      <table className="applicant-table">
        <tr>
          <th>Applicant #</th>
          <th>Total questions</th>
          <th>Number answered</th>
          <th>Number correct</th>
        </tr>
        {applicantRows}
      </table>
    );
  },
});

var InterfaceComponent = React.createClass({
  getInitialState: function() {
    return {
      loading: true,
      showAnswers: false,
      applicants: null
    };
  },
  componentDidMount: function() {
    var self = this;
    loadApplicants().done(function(applicants) {
      self.setState({loading: false, applicants: _.indexBy(applicants, 'id')});
    });
  },
  render: function() {
    var self = this;

    if (this.state.loading) {
      return (
        <div>Loading...</div>
      );
    }

    if (this.state.showAnswers) {
      return (
        <div>
          <div className="hide-answers">
            <a href="javascript:void(0);" onClick={this.hideAnswers}>Hide</a>
          </div>
          <AnswersTableComponent answers={this.state.answers} />
        </div>
      ); 
    }

    return <ApplicantTableComponent applicants={this.state.applicants} showAnswers={this.showAnswers} />;
  },
  showAnswers: function(id) {
    var self = this;
    self.setState({loading: true});
    loadAnswers(id).done(function(answers) {
      self.setState({loading: false, showAnswers: true, answers: answers});
    });
  },
  hideAnswers: function() {
    this.setState({showAnswers: false, answers: null});
  }
});

function loadAnswers(id) {
  return $.get("/applicants/" + id);
}

function loadApplicants() {
  return $.get("/applicants");
}

$(function() {
  React.renderComponent(
    <InterfaceComponent />,
    document.getElementById('example')
  );
});