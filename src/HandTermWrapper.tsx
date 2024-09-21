
import React, { useRef, useCallback, useEffect } from 'react';
import { HandTerm, IHandTermMethods, IHandTermProps } from './components/HandTerm';
import { ActivityType } from './types/Types';
import Phrases from './utils/Phrases';

const HandTermWrapper = React.forwardRef<IHandTermMethods, IHandTermProps>((props, ref) => {

  return (
    <HandTerm
      ref={ref as React.Ref<HandTerm>}
      {...props}
    />
  );
});

export default React.memo(HandTermWrapper);
