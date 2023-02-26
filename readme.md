# Scroll Image Sequence
Play an image sequence using canvas.

## Usage

##### Vanilla
```js
import ScrollImageSequence from 'scroll-image-sequence';

document.addEventListener("DOMContentLoaded", () => { 

	const target = document.getElementById("target")
	
	const options = {
		bounds: "outside",
		scrollStart: 0,
		scrollEnd: 1,
		frameCount: 49,
		debug: false,
	}
	
	ScrollImageSequence(target, options)
	
})
```


##### React & Typescript

```tsx
import React from 'react';
import ScrollImageSequence from 'scroll-image-sequence';

const ComponentType = {
	src: string,
}

const Component:React.FC<ComponentType> = ({src}) => {

	const imgRef = React.createRef();

	const options = {
		bounds: "outside",
		scrollStart: 0,
		scrollEnd: 1,
		frameCount: 49,
		debug: false,
	}

	React.useEffect(() => {

		ScrollImageSequence(imgRef.current, options)

	}, [])

	return <img src={src} ref={imgRef}>
}

export default Component;
```
## Notes
1. The target must be an `<img>` element.
1. The target must have `src` (or `srcset`) that points to a numbered image sequence. For exmaple: `000.jpg` or `sequence-01.png`.