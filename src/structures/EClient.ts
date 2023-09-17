import { LogLevel, Logger, SapphireClient } from '@sapphire/framework';
import config from '../config';
import { ActivityType, Partials } from 'discord.js';

export default class EClient extends SapphireClient {
	public _config: typeof config;
	public constructor() {
		super({
			allowedMentions: {
				parse: [
					'roles',
					'users',
				],
				repliedUser: false,
			},
			defaultPrefix: config.prefix,
			intents: [
				'GuildMembers',
				'Guilds',
				'GuildMessages',
				'MessageContent',
			],
			caseInsensitiveCommands: true,
			caseInsensitivePrefixes: true,
			failIfNotExists: true,
			loadDefaultErrorListeners: true,
			loadApplicationCommandRegistriesStatusListeners: true,
			loadMessageCommandListeners: true,
			logger: new Logger(LogLevel.Debug),
			presence: {
				activities: [
					{
						name: 'Sapphire radio',
						type: ActivityType.Listening,
					},
				],
			},
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.Message,
			],
		});
		this._config = config;
	}
	public start() {
		return super.login(this._config.token);
	}
}