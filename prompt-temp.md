I want to convert `HandTerm.tsx` into a functional component so that it interoperates better with other functional components in my app, but the `HandTerm.tsx` is 1158 lines long right now, which is too cumbersom to edit in this chat interface. 

So, I would like to refactor out as much as I can from `HandTerm.tsx` and into other compenents or code libraries. 

I would like you to deeply analyze the `HandTerm.tsx` to determine what code and be factored out, and then to move that code to a new file or an existing file of a suitable one already exists, and then to relink the function to `HandTerm.tsx` and make sure it's not still calling the function with `this.`. 

I would like to move one function per git commit, and to make sure that the refactor is complete and still functioning before moving on to another function or component.   