// HandexTerm.ts
import { LogKeys, TimeHTML, CharDuration, CharWPM } from './TerminalTypes';
import { IWPMCalculator, WPMCalculator } from './WPMCalculator';
import { IPersistence, LocalStoragePersistence } from './Persistence';
import { createHTMLElementFromHTML } from '../utils/dom';
import React from 'react';

export interface IHandexTerm {
  // Define the interface for your HandexTerm logic
  handleCommand(input: string): string;
  clearCommandHistory(): void;
  handleCharacter(character: string): number;
  getCommandHistory(): string[];
}


export class HandexTerm implements IHandexTerm {
  // Implement the interface methods
  private _persistence: IPersistence;
  private _commandHistory: string[] = [];
  private wpmCalculator: IWPMCalculator = new WPMCalculator();
  private static readonly commandHistoryLimit = 100;

  constructor() {
    this._persistence = new LocalStoragePersistence();
  }


  public handleCommand(command: string): string {
    let status = 404;
    let response = "Command not found.";
    if (command === 'clear') {
      status = 200;
      this.clearCommandHistory();
      return '';
    }
    if (command === 'play') {
      status = 200;
      response = "Would you like to play a game?"
    }
    if (command === 'phrase') {
      status = 200;
      response = "Type the phrase as fast as you can."
    }
    if (command.startsWith('video --')) {
      status = 200;
      if (command === 'video --true') {
        response = "Starting video camera..."
      }
      else {
        response = "Stopping video camera..."
      }
    }

    // Truncate the history if it's too long before saving
    if (this._commandHistory.length > HandexTerm.commandHistoryLimit) {
      this._commandHistory.shift(); // Remove the oldest command
    }
    let commandResponse = this.saveCommandResponseHistory(command, response, status); // Save updated history to localStorage
    return commandResponse;
  }

  parseCommand(input: string): void {
    const args = input.split(/\s+/); // Split the input by whitespace
    const command = args[0]; // The first element is the command

    // Now you can handle the command and options


    // Based on the command, you can switch and call different functions
    switch (command) {
      case 'someCommand':
        // Handle 'someCommand'
        break;
      // Add cases for other commands as needed
      default:
        // Handle unknown command
        break;
    }
  }

  getCommandHistory(): string[] {
    let keys: string[] = [];
    let commandHistory: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      if (!localStorage.key(i)?.startsWith(LogKeys.Command)) continue;

      const key = localStorage.key(i);
      if (!key) continue;
      keys.push(key);
    }
    keys.sort();
    for (let key of keys) {
      const historyJSON = localStorage.getItem(key);
      if (historyJSON) {
        commandHistory.push(historyJSON);
      }
    }
    return commandHistory;
  }

  private WpmsToHTML(wpms: CharWPM[], name: string | undefined) {
    name = name ?? "slowest-characters";
    return (
      <dl id={name} >
        {wpms.map((wpm, index) => (
          <React.Fragment key={index}>
            <dt>{wpm.character}</dt>
            <dd>{wpm.wpm.toFixed(2)}</dd>
          </React.Fragment>
        ))}
      </dl>
    );
  }

  private saveCommandResponseHistory(command: string, response: string, status: number): string {
    const commandTime = new Date();
    const timeCode = this.createTimeCode(commandTime).join(':');
    let commandText = this.createCommandRecord(command, commandTime);
    const commandElement = createHTMLElementFromHTML(commandText);
    let commandResponseElement = document.createElement('div');
    commandResponseElement.dataset.status = status.toString();
    commandResponseElement.appendChild(commandElement);
    commandResponseElement.appendChild(createHTMLElementFromHTML(`<div class="response">${response}</div>`));

    // Only keep the latest this.commandHistoryLimit number of commands
    const wpms = this.wpmCalculator.getWPMs();
    console.log("WPMs:", wpms);
    let wpmSum = this.wpmCalculator.saveKeystrokes(timeCode);
    this.wpmCalculator.clearKeystrokes();
    commandResponseElement.innerHTML = commandResponseElement.innerHTML.replace(/{{wpm}}/g, ('_____' + wpmSum.toFixed(0)).slice(-4));
    this._persistence.setItem(`${LogKeys.Command}_${timeCode}`, commandResponseElement.outerHTML);

    commandText = commandText.replace(/{{wpm}}/g, ('_____' + wpmSum.toFixed(0)).slice(-4));

    if (!this._commandHistory) { this._commandHistory = []; }
    const commandResponse = commandResponseElement.outerHTML;
    this._commandHistory.push(commandResponse);
    const wpmsHTML = this.WpmsToHTML(wpms.charWpms, "Lowest WPMs");
    this._commandHistory.push(wpmsHTML.toString());
    return commandResponse;

  }

  clearCommandHistory(): void {
    let keys: string[] = [];
    for (let i = localStorage.length; i >= 0; i--) {
      let key = localStorage.key(i);
      if (!key) continue;
      if (
        key.includes(LogKeys.Command)
        || key.includes('terminalCommandHistory') // Remove after clearing legacy phone db.
        || key.includes(LogKeys.CharTime)
      ) {
        keys.push(key);
      }
    }
    for (let key of keys) {
      localStorage.removeItem(key); // Clear localStorage.length
    }
    this._commandHistory = [];
  }


  public handleCharacter(character: string): number {
    const charDuration: CharDuration = this.wpmCalculator.addKeystroke(character);
    const wpm = this.wpmCalculator.getWPM(charDuration);
    console.log('wpm', wpm);
    return charDuration.durationMilliseconds;
  }

  createCommandRecord(command: string, commandTime: Date): string {
    let commandText = `<div class="log-line"><span class="log-time">[${this.createTimeHTML(commandTime)}]</span><span class="wpm">{{wpm}}</span>${command}</div>`;
    return commandText;
  }

  private createTimeCode(now = new Date()): string[] {
    return now.toLocaleTimeString('en-US', { hour12: false }).split(':');
  }

  private createTimeHTML(time = new Date()): TimeHTML {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    return `<span class="log-hour">${hours}</span><span class="log-minute">${minutes}</span><span class="log-second">${seconds}</span>`;
  }

}