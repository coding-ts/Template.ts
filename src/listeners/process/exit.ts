import { Listener } from '@sapphire/framework';
import { rmSync } from 'node:fs';

export class Exit extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			name: 'exit',
			emitter: process,
			once: true,
		});
	}
	public async run() {
		this.container.client.destroy();
		return rmSync(`${process.cwd()}/dist`, { recursive: true, force: true });
	}
}