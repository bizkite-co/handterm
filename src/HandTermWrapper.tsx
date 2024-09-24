
import React from 'react';
import { HandTerm, IHandTermMethods, IHandTermProps } from './components/HandTerm';

const HandTermWrapper = React.forwardRef<IHandTermMethods, IHandTermProps>((props, ref) => {

  return (
    <HandTerm
      ref={ref as React.Ref<HandTerm>}
      {...props}
    />
  );
});

export default React.memo(HandTermWrapper);
