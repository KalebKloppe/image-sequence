# Image Sequencer

Play an image sequence using canvas.

## Usage
1. The target must be an `<img>` element.
1. The target must have `src` (or `srcset`) that points to a numbered image sequence. For exmaple: `000.jpg` or `sequence-12.png`.

### Vanilla
```js
import ImageSequencer from 'image-sequencer';

document.addEventListener("DOMContentLoaded", () => { 

	const target = document.getElementById("target")
	
	const options = {
		bounds: "outside",
		scrollStart: 0,
		scrollEnd: 1,
		frameCount: 49,
		debug: false,
	}
	
	ImageSequencer(target, options)
	
})
```


### React

```jsx
import React from 'react';
import ImageSequencer from 'image-sequencer';

const ImageSequencerType = {
	src: string,
}

const ImageSequencerComponent:React.FC<ImageSequencerType> = () => {

	const imgRef = React.createRef();

	const options = {
		bounds: "outside",
		scrollStart: 0,
		scrollEnd: 1,
		frameCount: 49,
		debug: false,
	}

	React.useEffect(() => {

		ImageSequencer(ref.current, options)

	}, [])

	return <img src='/image-00.jpg' ref={imgRef}>
}

export default ImageSequencerComponent;
```