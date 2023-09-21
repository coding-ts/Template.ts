import { Args, Command } from '@sapphire/framework';
import type { Subcommand } from '@sapphire/plugin-subcommands';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, Message, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

export class Help extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			name: 'help',
			aliases: ['h', 'hp'],
			description: 'Display the bot\'s help menu',
		});
	}
	public async messageRun(message: Message, args: Args) {
		const query = await args.pick('string').then(value => value.toLowerCase()).catch(() => null);
		if (query) {
			const command = this.container.stores.get('commands').get(query as unknown as string) ?? this.container.stores.get('commands').find(cmd => cmd.aliases.includes(query));
			if (!command) {
				return message.reply({
					embeds: [
						new EmbedBuilder()
							.setColor(message.client._config.color.error)
							.setDescription(`The command \`${query.length > 10 ? `${query.slice(0, 10)}...` : query}\` does not exist.`)
							.setFooter({
								text: `${message.author.username} [${message.author.globalName}]`,
								iconURL: message.author.avatarURL() as string,
							})
							.setTimestamp(new Date()),
					],
				});
			}
			const embed = new EmbedBuilder()
				.setColor(message.client._config.color.default)
				.setFields({
					name: 'Description',
					value: `・${command.description}`,
				}, {
					name: 'Full category',
					value: `・${command.fullCategory.join(' > ')}`,
				})
				.setFooter({
					text: `${message.author.username} [${message.author.globalName}]`,
					iconURL: message.author.avatarURL() as string,
				})
				.setTitle(`${query} command`)
				.setTimestamp(new Date());
			const generalButton = new ButtonBuilder()
				.setCustomId('general')
				.setLabel('General')
				.setStyle(ButtonStyle.Success)
				.setDisabled(true);
			const row = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(generalButton);
			const aliasButton = new ButtonBuilder()
				.setCustomId('alias')
				.setLabel(command.aliases.length === 1 ? 'Alias' : 'Aliases')
				.setStyle(ButtonStyle.Secondary);
			const subcommandButton = new ButtonBuilder()
				.setCustomId('subcommand')
				.setLabel(`Subcommand${(command as Subcommand).options.subcommands?.length === 1 ? '' : 's'}`)
				.setStyle(ButtonStyle.Secondary);
			if (command.aliases.length) row.addComponents(aliasButton);
			if ((command as Subcommand).options.subcommands) row.addComponents(subcommandButton);
			let msg: Message;
			return (msg = await message.reply({
				embeds: [embed],
				components: row.components.length ? [row] : [],
			})).createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter: (interaction) => {
					if (interaction.user.id != message.author.id) {
						interaction.reply({
							embeds: [
								new EmbedBuilder()
									.setColor(message.client._config.color.error)
									.setDescription('You can not use this button as you are not the one who requested this menu.')
									.setFooter({
										text: `${interaction.user.username} [${interaction.user.globalName}]`,
										iconURL: interaction.user.avatarURL() as string,
									})
									.setTimestamp(new Date()),
							],
							ephemeral: true,
						});
						return false;
					}
					return true;
				},
				time: 5 * 60 * 1000,
			}).on('collect', async interaction => {
				if (interaction.customId === 'general') {
					generalButton.setStyle(ButtonStyle.Success).setDisabled(true);
					const generalRow = new ActionRowBuilder<ButtonBuilder>()
						.addComponents(generalButton);
					if (command.aliases.length) generalRow.addComponents(aliasButton.setStyle(ButtonStyle.Secondary).setDisabled(false));
					if ((command as Subcommand).options.subcommands) generalRow.addComponents(subcommandButton.setStyle(ButtonStyle.Secondary).setDisabled(false));
					interaction.update({
						embeds: [embed],
						components: [generalRow],
					});
				}
				else if (interaction.customId === 'alias') {
					aliasButton.setStyle(ButtonStyle.Success).setDisabled(true);
					interaction.update({
						embeds: [
							new EmbedBuilder()
								.setColor(message.client._config.color.default)
								.setDescription(`・${command.aliases.map(alias => `\`${alias}\``).join(', ')}`)
								.setFooter({
									text: `${message.author.username} [${message.author.globalName}]`,
									iconURL: message.author.avatarURL() as string,
								})
								.setTitle(`Alias${command.aliases.length === 1 ? '' : 'es'} for \`${query}\``)
								.setTimestamp(new Date()),
						],
						components: [
							new ActionRowBuilder<ButtonBuilder>()
								.setComponents(
									(command as Subcommand).options.subcommands?.length
										? [generalButton.setStyle(ButtonStyle.Secondary).setDisabled(false), aliasButton, subcommandButton.setStyle(ButtonStyle.Secondary).setDisabled(false)]
										: [generalButton.setStyle(ButtonStyle.Secondary).setDisabled(false), aliasButton],
								),
						],
					});
				}
				else {
					subcommandButton.setStyle(ButtonStyle.Success).setDisabled(true);
					interaction.update({
						embeds: [
							new EmbedBuilder()
								.setColor(message.client._config.color.default)
								.setFields(
									(command as Subcommand).parsedSubcommandMappings.map(subcommand => {
										return {
											name: subcommand.name,
											value: `・${command.description}`,
										};
									}),
								)
								.setFooter({
									text: `${message.author.username} [${message.author.globalName}]`,
									iconURL: message.author.avatarURL() as string,
								})
								.setTimestamp(new Date()),
						],
						components: [
							new ActionRowBuilder<ButtonBuilder>()
								.setComponents(
									command.aliases.length
										? [generalButton.setStyle(ButtonStyle.Secondary).setDisabled(false), aliasButton.setStyle(ButtonStyle.Secondary).setDisabled(false), subcommandButton]
										: [generalButton.setStyle(ButtonStyle.Secondary).setDisabled(false), subcommandButton],
								),
						],
					});
				}
			}).on('end', () => {
				row.components.forEach(component => component.setDisabled(true));
				msg.edit({
					components: [row],
				});
			});
		}
		const categories = new Array<string>();
		const categoriesMap = new Map<string, number>();
		let totalCommandCount = 0;
		this.container.stores.get('commands').forEach(command => {
			if (!categories.includes(command.fullCategory[0])) categories.push(command.fullCategory[0]);
			const commandCount = (command as Subcommand).options.subcommands?.length ?? 1;
			totalCommandCount += commandCount;
			categoriesMap.set(command.fullCategory[0], categoriesMap.get(command.fullCategory[0]) ? categoriesMap.get(command.fullCategory[0])! + commandCount : commandCount);
		});
		categories.sort();
		let msg: Message;
		const row = new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('selectmenu')
					.setPlaceholder('Select a category to get more information on')
					.setOptions(
						categories.map(
							category => new StringSelectMenuOptionBuilder()
								.setDescription(`${categoriesMap.get(category)} available commands`)
								.setLabel(category)
								.setValue(category),
						),
					)
			);
		return (msg = await message.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(message.client._config.color.default)
					.setDescription(`My current prefix${message.client._config.prefix.length > 1 ? 'es are' : ' is'} ${message.client._config.prefix.map(prefix => `\`${prefix}\``).join(', ')}. Type \`${message.client._config.prefix[0]}help [command]\` to get information on a specific command.`)
					.setFields(
						{
							name: 'Catogories',
							value: categories.map(category => `・${category} commands`).join('\n'),
							inline: true,
						},
						{
							name: `${totalCommandCount} total command${totalCommandCount === 1 ? '' : 's'}`,
							value: `${categories.map(category => `・${categoriesMap.get(category)} ${category.toLowerCase()} command${categoriesMap.get(category) === 1 ? '' : 's'}`)}`,
							inline: true,
						},
					)
					.setFooter({
						text: `${message.author.username} [${message.author.globalName}]`,
						iconURL: message.author.avatarURL() as string,
					})
					.setTimestamp(new Date())
					.setTitle('Help menu'),
			],
			components: [row],
		})).createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			filter: (interaction) => {
				if (interaction.user.id != message.author.id) {
					interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setColor(message.client._config.color.error)
								.setDescription('You can not use this button as you are not the one who requested this menu.'),
						],
						ephemeral: true,
					});
					return false;
				}
				return true;
			},
			time: 5 * 60 * 1000,
		}).on('collect', interaction => {
			const embed = new EmbedBuilder()
				.setColor(message.client._config.color.default)
				.setFooter({
					text: `${message.author.username} [${message.author.globalName}]`,
					iconURL: message.author.avatarURL() as string,
				})
				.setTimestamp(new Date())
				.setTitle(`${interaction.values[0]} commands`);
			this.container.stores.get('commands').forEach(command => {
				if (command.fullCategory[0] === interaction.values[0]) {
					if ((command as Subcommand).options.subcommands?.length) {
						(command as Subcommand).parsedSubcommandMappings.forEach(
							subcommand => embed.addFields({
								name: `${command.name} ${subcommand.name}`,
								value: `・${command.description} [subcommand]`,
							}),
						);
					}
					else {
						embed.addFields({
							name: command.name,
							value: `・${command.description} [command]`,
						});
					}
				}
			});
			interaction.update({
				embeds: [embed],
			});
		}).on('end', () => {
			row.components.forEach(component => component.setDisabled(true));
			msg.edit({
				components: [row],
			});
		});
	}
}