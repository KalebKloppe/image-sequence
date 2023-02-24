interface options {
	target: string	// Ref or ID
	scrollStart: number
	scrollEnd: number
	frameCount: number
}

function Main<options>(
	{	// Default options
		target,
		scrollStart = 0,
		scrollEnd = 1,
		frameCount = 0,
	}
) {
	// get the image node
	const image = document.getElementById(target) as HTMLImageElement
	const imageStyles = window.getComputedStyle(image);
	const src = image.currentSrc

	// Create an array of file names given the first src in the sequence and the frameCount

	// split the url by "/" and "." 
	// for example, "https://example.com/images/movie-0000.jpg" becomes ["movie-0000", "jpg"]
	const splitSrc = src.split("/").pop()?.split(".") as string[]

	// find the filename
	// for example, "https://example.com/images/movie-0000.jpg" becomes "movie-0000.jpg"
	const fileName = splitSrc[0] as string

	// find the last numbers in the filename
	// for example, "12-movie-0000.jpg" becomes "0000"
	const numbers = fileName.match(/\d+/g)?.pop() as string

	// find how many digits are in the filename
	// for example, "movie-0000.jpg" becomes 4 because there are 4 digits in the filename				
	const frameCountLength = numbers.length as number

	// determine the other file names in the image sequence
	// for example, "https://example.com/images/movie-0000.jpg" becomes ["https://example.com/images/movie-0000.jpg","https://example.com/images/movie-0001.jpg", etc ] 
	const srcArray = Array.from({ length: frameCount + 1 }, (_, i) => {
		const newFileName = fileName.replace(numbers, String(i).padStart(frameCountLength, "0"))
		return src.replace(fileName, newFileName)
	}) as string[]

	// get the image dimensions
	const drawWidth = image.naturalWidth
	const drawHeight = image.naturalHeight

	// the parent node of the image
	const container = image.parentNode as HTMLElement

	// create the canvas
	const canvas = document.createElement('canvas');
	canvas.width = drawWidth
	canvas.height = drawHeight

	// style <canvas> to match the <img>
	if (image.style.cssText !== '') {

		canvas.style.cssText = image.style.cssText;

	} else {

		// TODO: Check if CSS Value is different, only change if it differs
		const cssText = Object.values(imageStyles).reduce(

			(css, propertyName) => `${css}${propertyName}:${imageStyles.getPropertyValue(propertyName)};`

		);

		canvas.style.cssText = cssText
	}

	// draw the first image on the canvas context
	const context = canvas.getContext("2d") as CanvasRenderingContext2D;
	const canvasImage = new Image()
	canvasImage.src = src
	context.drawImage(canvasImage, 0, 0, drawWidth, drawHeight)


	// delete <image> and add <canvas>
	container.insertBefore(canvas, image)
	container.removeChild(image)


	// 	load the images into an array
	const ImageArray = srcArray.map((src) => {
		const image = new Image()
		image.src = src
		return image
	})

	// Draw Frame In Canvas
	function drawFrame(image) {
		// Clear the canvas
		context.clearRect(0, 0, drawWidth, drawHeight);
		// draw the image
		context.drawImage(image, 0, 0, drawWidth, drawHeight)
	}

	drawFrame(canvasImage)

	// Determine when to begin and end the animation where the user scrolls
	let currentFrame;
	function remeasure() {
		let element = canvas.getBoundingClientRect();
		let viewportHeight = window.innerHeight

		// scrollProgress = 0 when the canvas is at the bottom of the viewport
		// scrollProgress = 1 when the canvas is at the top of the viewport
		const scrollProgress = element.bottom / (viewportHeight + (element.bottom - element.top))

		// Determine the frameIndex. 0 when the canvas is at the bottom of the viewport. Equal to frameCount when the canvas is at the top of the viewport.
		const frameIndex = (Math.round(scrollProgress * frameCount) - frameCount) * -1

		// clamp the frameIndex between 0 and the frameCount
		const clampedFrameIndex = Math.min(Math.max(frameIndex, 0), frameCount)

		// throttle the animation by framerate
		window.requestAnimationFrame(animate);
		function animate() {
			// don't update if the frameIndex is outside the range of the animation
			if (0 > frameIndex || frameIndex > frameCount) return

			// don't update if the frameIndex is the same as the currentFrame
			if (frameIndex === currentFrame) return

			// draw the frame
			currentFrame = clampedFrameIndex;
			drawFrame(ImageArray[clampedFrameIndex])
		}
	}

	document.addEventListener("scroll", remeasure)



	// TODO: allow user to define the scrollStart and scrollEnd

	// TODO: if scrollStart and scrollEnd are backwards reverse the video

	// TODO: only add the event listener if the object is inside the viewport using intersection observer

	// TODO: event listener for changes in screen size to change the canvas size

	// TODO: load images async, only replace <image> when they have loaded. Abort when images take too long?

	// TODO: handle image load errors

}

export default Main