import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux';
import { addLog } from '../store/logs'
import { toggleTimer } from '../store/timer'

let countDownDate

window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const speechRecognizer = new SpeechRecognition()
let finalTranscripts = ''

export class SpeechConvertBox extends Component {
    constructor() {
        super()
        this.state = ({
            speech: '',
            hours: '00',
            minutes: '00',
            seconds: '00'
        })
        this.startConverting = this.startConverting.bind(this)
        this.transcribe = this.transcribe.bind(this)
        // this.startTimer = this.startTimer.bind(this)
        this.timeCount = this.timeCount.bind(this)
    }

    transcribe(event) {
        let interimTranscripts = '\n'
        for (let i = event.resultIndex; i < event.results.length; i++) {
            let transcript = event.results[i][0].transcript
            transcript.replace("\n", "<br>")
            if (event.results[i].isFinal) {
                finalTranscripts += transcript
            } else {
                interimTranscripts += transcript
            }
        }
        this.setState({
            speech: `${finalTranscripts + interimTranscripts}`
        })
    }

    startConverting() {
        speechRecognizer.continuous = true
        speechRecognizer.interimResults = true
        speechRecognizer.lang = 'en-IN'
        speechRecognizer.start()

        speechRecognizer.onresult = this.transcribe

        setTimeout(() => {
            console.log('resetting')
            finalTranscripts = ''
            speechRecognizer.stop()
            this.state.speech.includes('like') && this.props.addLog(this.state.speech)
            this.setState({
                speech: '',
            })
            setTimeout(() => this.startConverting(), 700)
        }, 5000)
        setInterval(()=>this.timeCount(countDownDate), 100);
    }


    timeCount(countDownDate) {
        let now = new Date().getTime();
        let distance = now - countDownDate.getTime();

        let h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let hours = h < 10 ? `0${h}` : h

        let m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let minutes = m < 10 ? `0${m}` : m

        let s = Math.floor((distance % (1000 * 60)) / 1000);
        let seconds = s < 10 ? `0${s}` : s

        this.setState({
            hours,
            minutes,
            seconds
        })
    }

    // startTimer() {
    //     countDownDate = new Date()
    //     setInterval(()=>this.timeCount(countDownDate), 100);
    // }

    render() {
        const { hours, minutes, seconds } = this.state
        if(this.props.timer) {
            countDownDate = new Date()
            this.props.toggleTimer()
            this.startConverting()
        }
        return (
            <Fragment>
                <div id="sideBySide">
                    <div>{hours}:{minutes}:{seconds}</div>
                    <button onClick={this.props.toggleTimer}>BEGIN</button>
                </div>
                <div id="width" className="ui floating message">
                    <div className="text-box" contentEditable="true" suppressContentEditableWarning={true}>{this.state.speech}</div>
                    <button onClick={this.startConverting} className="ui button"><i className="fa fa-microphone"></i></button>
                </div>
                {/* <audio className="sound" src="beep.mp3"></audio> */}                
            </Fragment>
        )
    }

}

const mapStateToProps = state => ({
    timer: state.timer
})

const mapDispatchToProps = dispatch => ({
    addLog: str => dispatch(addLog(str)),
    toggleTimer: () => dispatch(toggleTimer())
})

export default connect(mapStateToProps, mapDispatchToProps)(SpeechConvertBox)