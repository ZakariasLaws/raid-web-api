import React, { Component } from 'react';
import {Button, Collapse} from 'react-bootstrap'
import {Utils} from "../utils";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from "@fortawesome/fontawesome-svg-core";
import { faAngleRight, faAngleDown } from "@fortawesome/free-solid-svg-icons";

library.add(faAngleRight, faAngleDown);

class Target extends Component {
    constructor(props){
        super(props);

        this.state = {
            running: false,
            extraInfoOpen: false,
            starting: false,
            stopping: false,
        };

        this.startDevice = this.startDevice.bind(this);
        this.stopDevice = this.stopDevice.bind(this);
        this.changeDropMenu = this.changeDropMenu.bind(this);
    }

    changeDropMenu(val){
        this.setState({extraInfoOpen: val});
    }

    startDevice(){
        if (!this.props.running){
            alert('Start the server first');
            return;
        }

        this.props.startDevice(this.props.id, this.props.data.ip, this.props.data.username, this.props.data.password, 't', "title: " + this.props.data.title)
            .then(response => {
                this.setState({running: true});
            })
            .catch(err => {
                console.log(err);
            });
    }

    stopDevice(){
        this.setState({running: false, starting: false, stopping: true});
        this.props.stopDevice(this.props.id, 't')
            .then(response => {
                setTimeout(() => {
                    if (this.state.stopping || this.state.running) {
                        console.log("TIMEOUT shutting down TARGET");
                        // Double check
                        fetch(`${Utils.RAID_URL.checkIfStopped}?role=t&id=${this.props.id}`)
                            .then(Utils.handleFetchErrors)
                            .then(response => {
                                console.log("TARGET DEVICE IS ALREADY STOPPED");
                                this.setState({running: false, stopping: false, starting: false});
                            })
                            .catch(err => {
                                console.log("TARGET is really not stopped: " + err);
                            });
                    }
                }, Utils.deviceShutdownTimeout);
            })
            .catch(response => {
                console.log(response);
            });
    }

    targetClosed(data) {
        let id = data.id;
        let code = data.code;

        if (id !== this.props.id) {
            return;
        }

        if (code === 130 || code === 137) {
            console.log("TARGET DEVICE IS STOPPED");
        } else {
            console.log("Shutdown TARGET failed with response " + JSON.stringify(data));
        }
        this.setState({running: false, starting: false, stopping: false});
    };

    componentDidMount() {
        // Setup socket
        this.props.socket.on(`target_closed-${this.props.id}`, data => {
            this.targetClosed(data);
        });

        this.props.socket.on(`target_started-${this.props.id}`, data => {
            if (data.id === this.props.id) {
                this.setState({running: true, starting: false, stopping: false});
            }
        });
    }

    render() {
        return (
            <div className="device-target card bg-white mb-3">
                <div className="card-header">
                    {/*{ this.state.extraInfoOpen ?*/}
                    {/*    <button className="drop-down-button btn-dark" onClick={() => this.changeDropMenu(false)}><FontAwesomeIcon icon="angle-down"/> </button> :*/}
                    {/*    <button className="drop-down-button btn-dark" onClick={() => this.changeDropMenu(true)}> <FontAwesomeIcon icon="angle-right"/> </button> }*/}
                    {this.props.data.title}
                    { this.state.running ?
                            <div className="device-spinner spinner-border text-success" role="status">
                                <span className="sr-only">Loading...</span>
                            </div> : this.state.starting ?
                            <div className="device-spinner spinner-border text-warning" role="status">
                                <span className="sr-only"> Loading...</span>
                            </div> : this.state.stopping ?
                            <div className="device-spinner spinner-border text-warning" role="status">
                                <span className="sr-only"> Loading...</span>
                            </div> : ''
                    }
                </div>
                <div className="card-body">
                    <h5 className="address">{this.props.data.username}@{this.props.data.ip}</h5>
                    {/*{ this.state.extraInfoOpen ? <div>*/}
                    {/*</div> : ''}*/}
                    <div className="card-text">
                        { this.state.running ?
                            <button className="btn-danger" onClick={this.stopDevice}>
                                STOP
                            </button> : this.state.stopping ?
                                <button className="btn-warning" onClick={() =>{}}>
                                    STOPPING
                                </button> : this.state.starting ?
                                    <button className="btn-warning" onClick={() =>{}}>
                                        STARTING
                                    </button> :
                                    <button className="btn-success" onClick={this.startDevice}>
                                        START
                                    </button>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default Target;