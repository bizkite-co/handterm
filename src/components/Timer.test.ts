// import { Timer } from './Timer';

// describe('Timer', () => {
//     let timer: Timer;

//     beforeEach(() => {
//         timer = new Timer(document.createElement('div'), (centiSecond: number) => {});
//     });

//     afterEach(() => {
//         timer.stop();
//     });

//     it('should have null intervalId initially', () => {
//         expect(timer['intervalId']).toBeNull();
//     });

//     it('should set intervalId after calling start', () => {
//         timer.start(100);
//         expect(timer['intervalId']).not.toBeNull();
//     });

//     it('should call updateCallback with the correct centiSecond value', (done) => {
//         const updateCallback = (centiSecond: number) => {
//             expect(centiSecond).toBe(timer.centiSecond);
//             done();
//         };

//         timer = new Timer(document.createElement('div'), updateCallback);
//         timer.start(100);
//     });
// });