require 'lissio/component/container'

module Component

class Page < Lissio::Component::Container
	def go(page, data = nil)
		case page
		when :index
			Payments.fetch.then {|payments|
				if payments.empty?
					render Info.new "No payments."
				else
					render PaymentList.new(self, payments)
				end
			}.rescue {|e|
				$console.log e.backtrace.join("\n")
				render Danger.new "Failed to load payments."
			}

		when :person
			Payments.fetch(name: data).then {|payments|
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
			}.rescue {
				render Danger.new "Failed to load payments."
			}

		when :item
			render Info.new "No payments."

		end
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
