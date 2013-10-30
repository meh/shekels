module Component

class Page < Lissio::Component
	def go(page, data = nil)
		case page
		when :index
			Payments.fetch {|payments|
				if not Payments === payments
					render Danger.new "Failed to load payments."
				elsif payments.empty?
					render Info.new "No payments."
				else
					render PaymentList.new(self, payments)
				end
			}

		when :person
			Payments.fetch(name: data) {|payments|
				if not Payments === payments
					render Danger.new "Failed to load payments."
				else
					shekels = payments.map {|p|
						amount = p.amount

						if p.sign == :-
							amount = -amount
						end

						amount
					}.reduce(0, :+)

					if shekels == 0
						render Info.new "Yours and #{data}'s shekels are at peace."
					elsif shekels < 0
						render Info.new! "You owe ₪ <span class='negative'>#{-shekels}</span> to #{data}."
					else
						render Info.new! "#{data} owes you ₪ <span class='positive'>#{shekels}</span>."
					end
				end
			}

		when :item
			render Info.new "No payments."

		end
	end

	def render(*content)
		content = [*@content] if content.empty?
		content.compact! # FIXME: when it's fixed

		element.clear

		content.each {|c|
			if String === c
				element << c
			else
				element << (c.render; c.element)
			end
		}
	end

	element '#page'

	css do
		rule '#page' do
			width 100.%
			margin 20.px, :auto
		end
	end
end

end
