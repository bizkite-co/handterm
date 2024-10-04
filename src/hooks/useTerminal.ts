 // hooks/useTerminal.ts                                                                             
 import { useCallback, useState, useEffect, useRef } from 'react';                                   
 import { useXTerm } from 'react-xtermjs';                                                           
 import { FitAddon } from '@xterm/addon-fit';                                                        
 import { XtermAdapterConfig } from '../components/XtermAdapterConfig';                              
                                                                                                     
 export const useTerminal = () => {                                                                  
   const { instance, ref: xtermRef } = useXTerm({ options: XtermAdapterConfig });                    
   const [commandLine, setCommandLine] = useState('');                                               
   const fitAddon = useRef(new FitAddon());                                                          
                                                                                                     
   const writeToTerminal = useCallback((data: string) => {                                           
     instance?.write(data);                                                                          
   }, [instance]);                                                                                   
                                                                                                     
   const handleData = useCallback((data: string) => {                                                
     if (data === '\r') { // Enter key                                                               
       instance?.writeln('');                                                                        
       // Handle command execution here                                                              
       setCommandLine('');                                                                           
       instance?.write('$ ');                                                                        
     } else if (data === '\x7F') { // Backspace                                                      
       if (commandLine.length > 0) {                                                                 
         instance?.write('\b \b');                                                                   
         setCommandLine(prev => prev.slice(0, -1));                                                  
       }                                                                                             
     } else {                                                                                        
       instance?.write(data);                                                                        
       setCommandLine(prev => prev + data);                                                          
     }                                                                                               
   }, [instance, commandLine]);                                                                      
                                                                                                     
   useEffect(() => {                                                                                 
     if (instance) {                                                                                 
       instance.loadAddon(fitAddon.current);                                                         
       fitAddon.current.fit();                                                                       
       instance.write('$ ');                                                                         
                                                                                                     
       const resizeHandler = () => fitAddon.current.fit();                                           
       window.addEventListener('resize', resizeHandler);                                             
                                                                                                     
       const dataHandler = instance.onData(handleData);                                              
                                                                                                     
       return () => {                                                                                
         window.removeEventListener('resize', resizeHandler);                                        
         dataHandler.dispose();                                                                      
       };                                                                                            
     }                                                                                               
   }, [instance, handleData]);                                                                       
                                                                                                     
   return {                                                                                          
     xtermRef,                                                                                       
     commandLine,                                                                                    
     writeToTerminal,                                                                                
   };                                                                                                
 };                               