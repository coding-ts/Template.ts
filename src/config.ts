import type { HexColorString } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const config = {
	token: process.env.TOKEN,
	prefix: [''],
	developers: [''],
	color: {
		default: '#184aff' as HexColorString,
		error: '#ff0000' as HexColorString,
	},
};

export default config;