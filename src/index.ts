interface options {
	target: string	// Ref or ID
	scrollStart: number
	scrollEnd: number
	bounds: "outside" | "center" | "inside"
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
	// get the image node, it's styles, the src, and the image dimensions
	const image = document.getElementById(target) as HTMLImageElement
	const src = image.currentSrc
	const drawWidth = image.naturalWidth
	const drawHeight = image.naturalHeight

	// the parent node of the image
	const container = image.parentNode as HTMLElement

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

	// create the canvas
	const canvas = document.createElement('canvas');
	canvas.width = drawWidth
	canvas.height = drawHeight


	// draw the first image on the canvas context
	const context = canvas.getContext("2d") as CanvasRenderingContext2D;
	const canvasImage = new Image()
	canvasImage.src = src
	context.drawImage(canvasImage, 0, 0, drawWidth, drawHeight)


	// Copy any attributes or styles from the <image> to <canvas>
	function copyAttributes(source) {
		[...source.attributes].forEach(attr => {
			canvas.setAttribute(attr.nodeName, attr.nodeValue)
		})
	}
	copyAttributes(image)

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

		let bounds = canvas.getBoundingClientRect();
		let viewportHeight = window.innerHeight
		let elementHeight = bounds.bottom - bounds.top
		let startLine = viewportHeight - (scrollStart * viewportHeight)
		let endLine = viewportHeight - (scrollEnd * viewportHeight)
		let animaitonDistance = startLine - endLine

		// Determine the scrollProgress. 0 when the canvas is at the startLine. Equal to 1 when the canvas is at the endLine.
		let scrollProgress = (((bounds.top - endLine) - animaitonDistance) * -1) / (elementHeight + animaitonDistance)

		// Determine the frameIndex. 0 when the canvas is at the startLine. Equal to frameCount when the canvas is at the endLine.
		let frameIndex = Math.round(scrollProgress * frameCount)

		// Clamp the frameIndex between 0 and the frameCount
		let clampedFrameIndex = Math.min(Math.max(frameIndex, 0), frameCount)

		// throttle the animation by framerate
		window.requestAnimationFrame(animate);
		function animate() {

			// don't update if the frameIndex is outside the range of the animation
			if (0 > frameIndex || frameIndex > frameCount) return

			// don't update if the frameIndex is the same as the currentFrame
			if (currentFrame === clampedFrameIndex) return

			// draw the frame
			drawFrame(ImageArray[clampedFrameIndex])

			// update the currentFrame
			currentFrame = clampedFrameIndex;

		}

	}

	document.addEventListener("scroll", remeasure)

	// TODO: allow user to define the bounds of the canvas. Does the animaton start when the canvas is outside the viewport, inside the viewport, or halfway to the center of the viewport?

	// TODO: if the image begins in the middle of the viewport. Use that as the scrollStart. For example: Hero Image

	// TODO: if scrollStart and scrollEnd are backwards reverse the video

	// TODO: only add the event listener if the object is inside the viewport using intersection observer

	// TODO: event listener for changes in screen size to change the canvas size
	// window.addEventListener("resize", setCanvasCSS)

	// TODO: load images async, only replace <image> when they have loaded. Abort when images take too long?

	// TODO: handle image load errors

}

export default Main